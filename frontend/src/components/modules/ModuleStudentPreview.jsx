import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  ExternalLink,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Lock,
  PlayCircle,
  Sparkles,
  X
} from 'lucide-react';

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
    if (!line.trim()) return <div key={`${keyPrefix}-break-${lineIdx}`} className="h-3" />;

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
    if (plainRest) parts.push(...linkifyRawUrls(plainRest, `${keyPrefix}-line-${lineIdx}-rest`));

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
          .map((imageItem) => ({ url: (imageItem?.url || '').trim(), context: (imageItem?.context || '').trim() }))
          .filter((imageItem) => imageItem.url)
      : [];

    if (!grouped.has(levelNumber)) {
      grouped.set(levelNumber, { levelNumber, title: levelTitle, sublevels: [] });
    }

    grouped.get(levelNumber).sublevels.push({
      id: rawLevel?._id || `level-${levelNumber}-${sublevelNumber}`,
      order: rawLevel?.order || index + 1,
      sublevelNumber,
      title: rawLevel?.title || `Subnivel ${levelNumber}.${sublevelNumber}`,
      contentText: rawLevel?.contentText || '',
      videoUrls,
      pdfUrl,
      images: imageItems.length ? imageItems : legacyImages,
      rawLevel
    });
  });

  return [...grouped.values()]
    .sort((a, b) => a.levelNumber - b.levelNumber)
    .map((group) => ({ ...group, sublevels: [...group.sublevels].sort((a, b) => a.sublevelNumber - b.sublevelNumber) }));
};

const flattenSublevels = (groupedLevels) => {
  const flat = [];
  groupedLevels.forEach((levelItem, levelIdx) => {
    levelItem.sublevels.forEach((sublevel, subIdx) => {
      flat.push({ levelIdx, subIdx, levelItem, sublevel });
    });
  });
  return flat;
};

const computeXpForOrder = (order, total) => {
  if (!total) return 0;
  const base = Math.floor(100 / total);
  const remainder = 100 - base * total;
  return base + (order <= remainder ? 1 : 0);
};

export default function ModuleStudentPreview({
  levels = [],
  moduleTitle = '',
  role = 'student',
  showActions = false,
  onAskHelp,
  onComplete,
  onFinishModule,
  completedLevelOrders = [],
  currentLevelOrder = 1
}) {
  const groupedLevels = useMemo(() => normalizeLevels(levels), [levels]);
  const flatSublevels = useMemo(() => flattenSublevels(groupedLevels), [groupedLevels]);
  const [expandedLevels, setExpandedLevels] = useState({});
  const [activeLevelIndex, setActiveLevelIndex] = useState(0);
  const [activeSublevelIndex, setActiveSublevelIndex] = useState(0);
  const [lightboxState, setLightboxState] = useState({ open: false, index: 0, images: [] });
  const [expandedContext, setExpandedContext] = useState(false);
  const [localCompletedOrders, setLocalCompletedOrders] = useState(completedLevelOrders || []);
  const [localCurrentOrder, setLocalCurrentOrder] = useState(currentLevelOrder || 1);
  const [processingNext, setProcessingNext] = useState(false);

  useEffect(() => {
    const nextExpanded = {};
    groupedLevels.forEach((_, idx) => {
      nextExpanded[idx] = true;
    });
    setExpandedLevels(nextExpanded);
    setActiveLevelIndex(0);
    setActiveSublevelIndex(0);
  }, [groupedLevels]);

  useEffect(() => {
    setLocalCompletedOrders(completedLevelOrders || []);
  }, [completedLevelOrders]);

  useEffect(() => {
    setLocalCurrentOrder(currentLevelOrder || 1);
  }, [currentLevelOrder]);

  const activeLevel = groupedLevels[activeLevelIndex] || null;
  const activeSublevel = activeLevel?.sublevels?.[activeSublevelIndex] || null;

  const activeFlatIndex = flatSublevels.findIndex(
    (item) => item.levelIdx === activeLevelIndex && item.subIdx === activeSublevelIndex
  );

  const activeLightboxContext = lightboxState.images[lightboxState.index]?.context || '';
  const contextLineBreaks = (activeLightboxContext.match(/\n/g) || []).length;
  const shouldAllowContextExpansion = activeLightboxContext.length > 260 || contextLineBreaks > 5;

  const isStudent = role === 'student';
  const completedSet = new Set(localCompletedOrders || []);
  const unlockedOrder = Math.max(localCurrentOrder || 1, 1);

  const getSublevelState = (sublevel) => {
    if (!isStudent) return { completed: false, locked: false };
    const completed = completedSet.has(sublevel.order);
    const locked = !completed && sublevel.order > unlockedOrder;
    return { completed, locked };
  };

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
    if (!lightboxState.open) setExpandedContext(false);
  }, [lightboxState.open, lightboxState.index]);

  const goToFlatIndex = (index) => {
    const item = flatSublevels[index];
    if (!item) return;
    setActiveLevelIndex(item.levelIdx);
    setActiveSublevelIndex(item.subIdx);
    setExpandedLevels((prev) => ({ ...prev, [item.levelIdx]: true }));
  };

  const handleNext = async () => {
    if (!activeSublevel || activeFlatIndex < 0 || processingNext) return;

    setProcessingNext(true);
    try {
      if (isStudent && !completedSet.has(activeSublevel.order)) {
        if (onComplete) {
          await onComplete(activeSublevel.rawLevel);
        }
        setLocalCompletedOrders((prev) => {
          if (prev.includes(activeSublevel.order)) return prev;
          return [...prev, activeSublevel.order];
        });
        setLocalCurrentOrder((prev) => Math.max(prev, activeSublevel.order + 1));
      }

      const isLastSublevel = activeFlatIndex >= flatSublevels.length - 1;
      if (isLastSublevel) {
        if (isStudent && onFinishModule) {
          await onFinishModule();
        }
        return;
      }

      goToFlatIndex(activeFlatIndex + 1);
    } finally {
      setProcessingNext(false);
    }
  };

  const handlePrev = () => {
    if (activeFlatIndex <= 0) return;
    goToFlatIndex(activeFlatIndex - 1);
  };

  const totalSublevels = flatSublevels.length;
  const activeOrder = activeSublevel?.order || 1;
  const activeXp = computeXpForOrder(activeOrder, totalSublevels);
  const activeState = activeSublevel ? getSublevelState(activeSublevel) : { completed: false, locked: false };
  const isLastSublevel = activeFlatIndex >= flatSublevels.length - 1;

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <aside className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900/85 dark:ring-slate-700/60">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Contenido del modulo</p>
        <div className="mt-3 space-y-2">
          {groupedLevels.map((levelItem, levelIdx) => {
            const isExpanded = !!expandedLevels[levelIdx];
            const isSelectedLevel = activeLevelIndex === levelIdx;
            const completedCount = levelItem.sublevels.filter((s) => completedSet.has(s.order)).length;
            const allLevelCompleted = isStudent && levelItem.sublevels.length > 0 && completedCount === levelItem.sublevels.length;

            return (
              <div key={`preview-level-${levelItem.levelNumber}`} className="border-b border-slate-200/80 py-2.5 last:border-b-0 dark:border-slate-700/70">
                <div
                  className="flex cursor-pointer items-center gap-2 rounded-lg"
                  onClick={() => {
                    const nextExpanded = !isExpanded;
                    setExpandedLevels((prev) => ({ ...prev, [levelIdx]: nextExpanded }));
                    setActiveLevelIndex(levelIdx);
                    if (nextExpanded) setActiveSublevelIndex(0);
                  }}
                >
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full ${allLevelCompleted ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                    {allLevelCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                  </div>

                  <div className="relative min-w-0 flex-1">
                    <div
                      className={`flex w-full min-w-0 items-start gap-2 rounded-lg px-2 py-2 pr-10 text-left text-sm transition ${
                        isSelectedLevel
                          ? 'bg-slate-200/70 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                          : 'text-slate-700 hover:bg-slate-100/90 dark:text-slate-200 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="whitespace-normal break-words font-semibold leading-snug">{levelItem.levelNumber}. {levelItem.title}</p>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{isStudent ? `${completedCount}/${levelItem.sublevels.length} lecciones` : `${levelItem.sublevels.length} lecciones`}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedLevels((prev) => ({ ...prev, [levelIdx]: !isExpanded }));
                      }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      title={isExpanded ? 'Contraer nivel' : 'Expandir nivel'}
                    >
                      <ChevronRight className={`h-4 w-4 transition ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className={`overflow-hidden transition-all duration-300 ease-out ${isExpanded ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="ml-9 mt-3 space-y-2.5 border-l-2 border-slate-200 pl-4 dark:border-slate-700">
                    {levelItem.sublevels.map((sublevel, subIdx) => {
                      const isSelected = isSelectedLevel && activeSublevelIndex === subIdx;
                      const state = getSublevelState(sublevel);

                      return (
                        <button
                          key={sublevel.id}
                          type="button"
                          disabled={state.locked}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveLevelIndex(levelIdx);
                            setActiveSublevelIndex(subIdx);
                          }}
                          className={`flex w-full items-start gap-2 rounded-xl px-3.5 py-3.5 text-left text-[13px] transition ${
                            state.locked
                              ? 'cursor-not-allowed bg-slate-100 text-slate-400 ring-1 ring-slate-200 dark:bg-slate-900/50 dark:text-slate-500 dark:ring-slate-700/50'
                              : isSelected
                                ? 'bg-cyan-500 text-white ring-2 ring-cyan-200 shadow-[0_0_0_3px_rgba(34,211,238,0.25)] dark:bg-cyan-500 dark:text-white dark:ring-cyan-300'
                                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900/60 dark:text-slate-300 dark:ring-slate-700/60 dark:hover:bg-slate-800/70'
                          }`}
                        >
                          {state.locked ? (
                            <Lock className="h-3.5 w-3.5" />
                          ) : state.completed ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Circle className="h-3.5 w-3.5" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="whitespace-normal break-words font-semibold leading-snug">
                              {levelItem.levelNumber}.{sublevel.sublevelNumber || subIdx + 1} {sublevel.title}
                            </p>
                            <p className={`mt-1 text-[10px] ${isSelected ? 'text-white/90' : 'text-slate-500 dark:text-slate-400'}`}>{computeXpForOrder(sublevel.order, totalSublevels)} XP</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {!activeSublevel ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/35">
          <div className="text-sm text-slate-500 dark:text-slate-400">Este modulo aun no tiene subniveles configurados.</div>
        </section>
      ) : (
          <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900/35">
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <ImageIcon className="h-3.5 w-3.5" /> {activeSublevel.images.length} imagenes
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <PlayCircle className="h-3.5 w-3.5" /> {activeSublevel.videoUrls.length} videos
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <FileText className="h-3.5 w-3.5" /> {activeSublevel.pdfUrl ? '1 PDF' : 'Sin PDF'}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">
                  <Sparkles className="h-3.5 w-3.5" /> {activeXp} XP
                </span>
                {isStudent && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${activeState.completed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200' : activeState.locked ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-200'}`}>
                    {activeState.completed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
                    {activeState.completed ? 'Completado' : activeState.locked ? 'Bloqueado' : 'En proceso'}
                  </span>
                )}
              </div>

              <h3 className="text-2xl font-bold leading-tight text-slate-900 dark:text-white">
                {activeLevel?.levelNumber}.{activeSublevel.sublevelNumber} {activeSublevel.title}
              </h3>

              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Instrucciones</p>
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

              <div className="flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-700">
              <button
                type="button"
                onClick={handlePrev}
                disabled={activeFlatIndex <= 0}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40 dark:border-slate-600 dark:text-slate-200"
              >
                <ChevronLeft className="h-4 w-4" /> Anterior
              </button>

              <div className="flex items-center gap-1.5">
                {flatSublevels.map((item, idx) => {
                  const state = getSublevelState(item.sublevel);
                  return (
                    <span
                      key={`dot-${item.sublevel.id}`}
                      className={`h-2.5 rounded-full ${
                        idx === activeFlatIndex
                          ? 'w-7 bg-brand-500'
                          : state.completed
                            ? 'w-2.5 bg-emerald-500'
                            : state.locked
                              ? 'w-2.5 bg-slate-300 dark:bg-slate-700'
                              : 'w-2.5 bg-cyan-500'
                      }`}
                    />
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleNext}
                disabled={activeState.locked || processingNext}
                className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-brand-500 to-cyan-400 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
              >
                {processingNext ? 'Guardando...' : isLastSublevel && isStudent ? 'Finalizar modulo' : 'Siguiente'} <ChevronRight className="h-4 w-4" />
              </button>
              </div>

              {showActions && (
              <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-3 dark:border-slate-700">
                {onAskHelp && (
                  <button
                    type="button"
                    onClick={() => onAskHelp(activeSublevel.rawLevel)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500/15 px-3 py-2 text-xs font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-100"
                  >
                    <HelpCircle className="h-4 w-4" /> Pedir ayuda
                  </button>
                )}
              </div>
            )}
            </div>
          </section>
      )}

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
              <img src={lightboxState.images[lightboxState.index]?.url} alt={`Imagen ${lightboxState.index + 1}`} className="max-h-full w-full object-contain" />
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
