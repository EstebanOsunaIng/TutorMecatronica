import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, ExternalLink, FileText, Folder, FolderOpen, HelpCircle, X } from 'lucide-react';

const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const rawUrlRegex = /https?:\/\/[^\s]+/g;

const splitTrailingPunctuation = (token) => {
  let clean = token;
  let trailing = '';

  while (clean && /[),.;!?]$/.test(clean)) {
    trailing = clean.slice(-1) + trailing;
    clean = clean.slice(0, -1);
  }

  return { clean, trailing };
};

const getShortUrlLabel = (url) => {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname === '/' ? '' : parsed.pathname;
    const compact = `${parsed.hostname}${path}`;
    return compact.length > 48 ? `${compact.slice(0, 45)}...` : compact;
  } catch {
    return url;
  }
};

const linkifyRawUrls = (text, keyPrefix) => {
  const nodes = [];
  let cursor = 0;
  let match;
  let counter = 0;

  rawUrlRegex.lastIndex = 0;

  while ((match = rawUrlRegex.exec(text)) !== null) {
    const token = match[0];
    const start = match.index;
    const before = text.slice(cursor, start);
    if (before) nodes.push(before);

    const { clean, trailing } = splitTrailingPunctuation(token);
    if (clean) {
      nodes.push(
        <a
          key={`${keyPrefix}-raw-${counter}`}
          href={clean}
          target="_blank"
          rel="noreferrer"
          className="text-cyan-700 underline underline-offset-2 hover:text-cyan-600 dark:text-cyan-300 dark:hover:text-cyan-200"
        >
          {getShortUrlLabel(clean)}
        </a>
      );
    }
    if (trailing) nodes.push(trailing);

    cursor = start + token.length;
    counter += 1;
  }

  const rest = text.slice(cursor);
  if (rest) nodes.push(rest);
  return nodes;
};

const renderFormattedText = (text, keyPrefix) => {
  const value = String(text || '');
  if (!value.trim()) return 'Sin informacion.';

  const lines = value.split('\n');

  return lines.map((line, lineIdx) => {
    if (!line.trim()) {
      return <div key={`${keyPrefix}-break-${lineIdx}`} className="h-3" />;
    }

    const parts = [];
    let cursor = 0;
    let match;
    let linkIdx = 0;

    markdownLinkRegex.lastIndex = 0;
    while ((match = markdownLinkRegex.exec(line)) !== null) {
      const [full, label, url] = match;
      const start = match.index;
      const plainBefore = line.slice(cursor, start);
      if (plainBefore) {
        parts.push(...linkifyRawUrls(plainBefore, `${keyPrefix}-line-${lineIdx}-before-${linkIdx}`));
      }

      parts.push(
        <a
          key={`${keyPrefix}-md-${lineIdx}-${linkIdx}`}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-cyan-700 underline underline-offset-2 hover:text-cyan-600 dark:text-cyan-300 dark:hover:text-cyan-200"
        >
          {label}
        </a>
      );

      cursor = start + full.length;
      linkIdx += 1;
    }

    const plainRest = line.slice(cursor);
    if (plainRest) {
      parts.push(...linkifyRawUrls(plainRest, `${keyPrefix}-line-${lineIdx}-rest`));
    }

    return (
      <p key={`${keyPrefix}-line-${lineIdx}`} className="whitespace-pre-wrap">
        {parts.length ? parts : line}
      </p>
    );
  });
};

const getYouTubeId = (url) => {
  if (!url) return '';
  const input = url.trim();

  const shortMatch = input.match(/youtu\.be\/([^?&/]+)/i);
  if (shortMatch?.[1]) return shortMatch[1];

  const watchMatch = input.match(/[?&]v=([^?&/]+)/i);
  if (watchMatch?.[1]) return watchMatch[1];

  const embedMatch = input.match(/youtube\.com\/(embed|shorts)\/([^?&/]+)/i);
  if (embedMatch?.[2]) return embedMatch[2];

  return '';
};

const buildEmbedUrl = (url) => {
  const id = getYouTubeId(url);
  if (id) return `https://www.youtube.com/embed/${id}`;
  return url;
};

const normalizeLevels = (levels) => {
  const grouped = new Map();

  const ordered = [...(Array.isArray(levels) ? levels : [])].sort((a, b) => (a?.order || 0) - (b?.order || 0));

  ordered.forEach((rawLevel, index) => {
    const resources = Array.isArray(rawLevel?.resources) ? rawLevel.resources : [];
    const parsedLevelNumber = Number(rawLevel?.levelNumber);
    const parsedSublevelNumber = Number(rawLevel?.sublevelNumber);
    const levelNumber = Number.isFinite(parsedLevelNumber) && parsedLevelNumber > 0 ? parsedLevelNumber : index + 1;
    const sublevelNumber = Number.isFinite(parsedSublevelNumber) && parsedSublevelNumber > 0 ? parsedSublevelNumber : 1;
    const levelTitle = (rawLevel?.levelTitle || '').trim() || `Nivel ${levelNumber}`;

    const secondaryVideos = resources
      .filter((item) => typeof item === 'string' && item.startsWith('video:'))
      .map((item) => item.slice(6))
      .filter(Boolean);

    const videoUrls = [rawLevel?.videoUrl || '', ...secondaryVideos].filter((url, i, arr) => url && arr.indexOf(url) === i);
    const pdfUrl = resources.find((item) => typeof item === 'string' && item.startsWith('pdf:'))?.slice(4) || '';

    const legacyImages = resources
      .filter((item) => typeof item === 'string' && !item.startsWith('video:') && !item.startsWith('pdf:'))
      .map((url) => ({ url, context: '' }));

    const imageItems = Array.isArray(rawLevel?.imageItems)
      ? rawLevel.imageItems
          .map((imageItem) => ({
            url: (imageItem?.url || '').trim(),
            context: (imageItem?.context || '').trim()
          }))
          .filter((imageItem) => imageItem.url)
      : [];

    const mergedImages = imageItems.length ? imageItems : legacyImages;

    if (!grouped.has(levelNumber)) {
      grouped.set(levelNumber, {
        levelNumber,
        title: levelTitle,
        sublevels: []
      });
    }

    grouped.get(levelNumber).sublevels.push({
      id: rawLevel?._id || `level-${levelNumber}-${sublevelNumber}`,
      sublevelNumber,
      title: rawLevel?.title || `Subnivel ${levelNumber}.${sublevelNumber}`,
      contentText: rawLevel?.contentText || '',
      contextForAI: rawLevel?.contextForAI || '',
      videoUrls,
      pdfUrl,
      images: mergedImages,
      rawLevel
    });
  });

  return [...grouped.values()]
    .sort((a, b) => a.levelNumber - b.levelNumber)
    .map((group) => ({
      ...group,
      sublevels: [...group.sublevels].sort((a, b) => a.sublevelNumber - b.sublevelNumber)
    }));
};

export default function ModuleStudentPreview({
  levels = [],
  moduleTitle = '',
  showActions = false,
  onAskHelp,
  onComplete
}) {
  const groupedLevels = useMemo(() => normalizeLevels(levels), [levels]);
  const [expandedLevels, setExpandedLevels] = useState({});
  const [activeLevelIndex, setActiveLevelIndex] = useState(0);
  const [activeSublevelIndex, setActiveSublevelIndex] = useState(0);
  const [lightboxState, setLightboxState] = useState({ open: false, index: 0, images: [] });
  const [expandedContext, setExpandedContext] = useState(false);

  useEffect(() => {
    const nextExpanded = {};
    groupedLevels.forEach((_, idx) => {
      nextExpanded[idx] = true;
    });
    setExpandedLevels(nextExpanded);
    setActiveLevelIndex(0);
    setActiveSublevelIndex(0);
  }, [groupedLevels]);

  const activeLevel = groupedLevels[activeLevelIndex] || null;
  const activeSublevel = activeLevel?.sublevels?.[activeSublevelIndex] || null;
  const activeLightboxContext = lightboxState.images[lightboxState.index]?.context || '';
  const contextLineBreaks = (activeLightboxContext.match(/\n/g) || []).length;
  const shouldAllowContextExpansion = activeLightboxContext.length > 260 || contextLineBreaks > 5;

  const openLightbox = (images, index) => {
    setLightboxState({ open: true, images, index });
  };

  const changeLightboxImage = (delta) => {
    setLightboxState((prev) => {
      if (!prev.images.length) return prev;
      const nextIndex = (prev.index + delta + prev.images.length) % prev.images.length;
      return { ...prev, index: nextIndex };
    });
    setExpandedContext(false);
  };

  useEffect(() => {
    if (!lightboxState.open) {
      setExpandedContext(false);
    }
  }, [lightboxState.open, lightboxState.index]);

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-2xl bg-slate-50 p-3 shadow-lg ring-1 ring-slate-200 dark:bg-slate-900/85 dark:ring-slate-700/60">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Estructura del modulo</p>
        <div className="mt-3 space-y-2">
          {groupedLevels.map((levelItem, levelIdx) => {
            const isExpanded = !!expandedLevels[levelIdx];
            const isSelectedLevel = activeLevelIndex === levelIdx;

            return (
              <div key={`preview-level-${levelItem.levelNumber}`} className="rounded-lg bg-white/80 dark:bg-slate-900/40">
                <div className="flex items-center gap-1 rounded-lg px-1.5 py-1">
                  <button
                    type="button"
                    onClick={() => setExpandedLevels((prev) => ({ ...prev, [levelIdx]: !isExpanded }))}
                    className="rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    title={isExpanded ? 'Contraer nivel' : 'Expandir nivel'}
                  >
                    <ChevronRight className={`h-4 w-4 transition ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveLevelIndex(levelIdx);
                      setActiveSublevelIndex(0);
                    }}
                    className={`flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition ${isSelectedLevel ? 'bg-brand-500/15 text-brand-600 dark:bg-brand-500/20 dark:text-brand-100' : 'text-slate-700 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800/80'}`}
                  >
                    {isExpanded ? <FolderOpen className="h-4 w-4 text-amber-300" /> : <Folder className="h-4 w-4 text-amber-300" />}
                    <span className="truncate">Nivel {levelItem.levelNumber}: {levelItem.title}</span>
                  </button>
                </div>

                {isExpanded && (
                  <div className="ml-8 mt-1 space-y-1 border-l border-slate-300 pl-3 dark:border-slate-700/80">
                    {levelItem.sublevels.map((sublevel, subIdx) => {
                      const isSelected = isSelectedLevel && activeSublevelIndex === subIdx;
                      return (
                        <button
                          key={sublevel.id}
                          type="button"
                          onClick={() => {
                            setActiveLevelIndex(levelIdx);
                            setActiveSublevelIndex(subIdx);
                          }}
                          className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition ${isSelected ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-100' : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800/70'}`}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span className="truncate">{levelItem.levelNumber}.{sublevel.sublevelNumber} {sublevel.title}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/35">
        {!activeSublevel ? (
          <div className="text-sm text-slate-500 dark:text-slate-400">Este modulo aun no tiene subniveles configurados.</div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{moduleTitle || 'Modulo'}</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {activeLevel?.levelNumber}.{activeSublevel.sublevelNumber} {activeSublevel.title}
              </h3>
              <div className="text-sm text-slate-700 dark:text-slate-300">{renderFormattedText(activeSublevel.contentText, 'sublevel-content')}</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Album de imagenes</p>
                <span className="text-xs text-slate-500 dark:text-slate-400">{activeSublevel.images.length} imagen(es)</span>
              </div>
              {activeSublevel.images.length ? (
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {activeSublevel.images.map((imageItem, imageIndex) => (
                    <button
                      key={`preview-image-${imageIndex + 1}`}
                      type="button"
                      onClick={() => openLightbox(activeSublevel.images, imageIndex)}
                      className="group overflow-hidden rounded-lg border border-slate-200 bg-white text-left dark:border-slate-700 dark:bg-slate-900"
                    >
                      <img src={imageItem.url} alt={`Imagen ${imageIndex + 1}`} className="h-32 w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                      <p className="line-clamp-2 p-2 text-xs text-slate-600 dark:text-slate-300">{imageItem.context || 'Sin contexto.'}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">No hay imagenes para este subnivel.</div>
              )}
            </div>

            {activeSublevel.videoUrls.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Videos</p>
                <div className="grid gap-3">
                  {activeSublevel.videoUrls.map((videoUrl, idx) => {
                    const embedUrl = buildEmbedUrl(videoUrl);
                    const isYouTube = !!getYouTubeId(videoUrl);

                    return (
                      <div key={`preview-video-${idx + 1}`} className="overflow-hidden rounded-lg border border-slate-700 bg-black">
                        {isYouTube ? (
                          <iframe
                            src={embedUrl}
                            title={`Video ${idx + 1}`}
                            className="aspect-video w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        ) : (
                          <video src={embedUrl} controls className="aspect-video w-full" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeSublevel.pdfUrl && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">PDF</p>
                <a
                  href={activeSublevel.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  Abrir PDF
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}

            {showActions && (
              <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-3 dark:border-slate-700">
                {onAskHelp && (
                  <button
                    type="button"
                    onClick={() => onAskHelp(activeSublevel.rawLevel)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500/15 px-3 py-2 text-xs font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-100"
                  >
                    <HelpCircle className="h-4 w-4" />
                    Pedir ayuda
                  </button>
                )}
                {onComplete && (
                  <button
                    type="button"
                    onClick={() => onComplete(activeSublevel.rawLevel)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Completar subnivel
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {lightboxState.open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-3">
          <button
            type="button"
            onClick={() => setLightboxState({ open: false, index: 0, images: [] })}
            className="absolute right-4 top-4 rounded-full bg-slate-800/80 p-2 text-slate-200 hover:bg-slate-700"
            title="Minimizar"
          >
            <X className="h-5 w-5" />
          </button>

          {lightboxState.images.length > 1 && (
            <button
              type="button"
              onClick={() => changeLightboxImage(-1)}
              className="absolute left-3 rounded-full bg-slate-800/80 p-2 text-slate-100 hover:bg-slate-700"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          <div className="mx-auto flex h-[88vh] w-full max-w-4xl flex-col rounded-xl bg-slate-950 p-3">
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg border border-slate-700 bg-black">
              <img
                src={lightboxState.images[lightboxState.index]?.url}
                alt={`Imagen ${lightboxState.index + 1}`}
                className="max-h-full w-full object-contain"
              />
            </div>
            <div className="relative mt-2 rounded-lg bg-slate-900/80 p-3 text-sm text-slate-200">
              <div className={`${expandedContext ? 'max-h-56 overflow-y-auto pr-1' : 'max-h-24 overflow-hidden'}`}>
                {renderFormattedText(lightboxState.images[lightboxState.index]?.context, 'image-context')}
              </div>

              {!expandedContext && shouldAllowContextExpansion && (
                <div className="pointer-events-none absolute inset-x-3 bottom-10 h-8 bg-gradient-to-t from-slate-900/95 to-transparent" />
              )}

              {shouldAllowContextExpansion && (
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setExpandedContext((prev) => !prev)}
                    className="rounded-md bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                  >
                    {expandedContext ? 'Ver menos' : 'Ver mas'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {lightboxState.images.length > 1 && (
            <button
              type="button"
              onClick={() => changeLightboxImage(1)}
              className="absolute right-3 rounded-full bg-slate-800/80 p-2 text-slate-100 hover:bg-slate-700"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
