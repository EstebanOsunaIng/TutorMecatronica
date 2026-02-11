import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Layers3, Link2, Plus, Upload, Video } from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Modal from '../../components/common/Modal.jsx';
import { modulesApi } from '../../api/modules.api.js';

const INITIAL_COVER_FORM = { title: '', description: '', category: 'General', imageUrl: '', level: 'Básico' };

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const createInitialDraftSublevel = () => ({
  existingId: '',
  title: '',
  contentText: '',
  videoUrls: [''],
  pdfUrl: '',
  imageItems: []
});

const createInitialDraftLevel = () => ({
  title: '',
  sublevels: [createInitialDraftSublevel()]
});

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

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

const getYouTubeThumbnail = (url) => {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : '';
};

const toDraftSublevel = (levelItem) => {
  const resources = Array.isArray(levelItem?.resources) ? levelItem.resources : [];
  const secondaryVideos = resources
    .filter((item) => typeof item === 'string' && item.startsWith('video:'))
    .map((item) => item.slice(6))
    .filter(Boolean);

  const pdfUrl = resources.find((item) => typeof item === 'string' && item.startsWith('pdf:'))?.slice(4) || '';

  const legacyImages = resources
    .filter((item) => typeof item === 'string' && !item.startsWith('video:') && !item.startsWith('pdf:'))
    .map((url) => ({
      id: createId(),
      sourceType: 'url',
      url,
      context: '',
      file: null,
      previewUrl: ''
    }));

  const persistedImages = Array.isArray(levelItem?.imageItems)
    ? levelItem.imageItems
        .map((imageItem) => ({
          id: createId(),
          sourceType: 'url',
          url: (imageItem?.url || '').trim(),
          context: (imageItem?.context || '').trim(),
          file: null,
          previewUrl: ''
        }))
        .filter((imageItem) => imageItem.url)
    : [];

  return {
    existingId: levelItem?._id || '',
    title: levelItem?.title || '',
    contentText: levelItem?.contentText || '',
    videoUrls: [levelItem?.videoUrl || '', ...secondaryVideos],
    pdfUrl,
    imageItems: persistedImages.length ? persistedImages : legacyImages
  };
};

const hydrateDraftLevels = (fetchedLevels) => {
  const safeLevels = Array.isArray(fetchedLevels) ? fetchedLevels : [];
  if (!safeLevels.length) return [createInitialDraftLevel()];

  const hasSublevelMetadata = safeLevels.some((item) => Number(item?.levelNumber) > 0);

  if (!hasSublevelMetadata) {
    return safeLevels
      .sort((a, b) => (a?.order || 0) - (b?.order || 0))
      .map((levelItem, index) => ({
        title: `Nivel ${index + 1}`,
        sublevels: [toDraftSublevel(levelItem)]
      }));
  }

  const grouped = new Map();

  safeLevels.forEach((levelItem) => {
    const parsedLevelNumber = Number(levelItem?.levelNumber);
    const parsedSublevelNumber = Number(levelItem?.sublevelNumber);
    const levelNumber = Number.isFinite(parsedLevelNumber) && parsedLevelNumber > 0 ? parsedLevelNumber : 1;
    const sublevelNumber = Number.isFinite(parsedSublevelNumber) && parsedSublevelNumber > 0 ? parsedSublevelNumber : 1;

    if (!grouped.has(levelNumber)) {
      grouped.set(levelNumber, {
        title: (levelItem?.levelTitle || '').trim() || `Nivel ${levelNumber}`,
        sublevels: []
      });
    }

    grouped.get(levelNumber).sublevels.push({
      order: sublevelNumber,
      sublevel: toDraftSublevel(levelItem)
    });
  });

  return [...grouped.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, group]) => ({
      title: group.title,
      sublevels: group.sublevels.sort((a, b) => a.order - b.order).map((item) => item.sublevel)
    }));
};

const serializeDraftState = (cover, draftLevels) =>
  JSON.stringify({
    cover: {
      title: (cover?.title || '').trim(),
      description: (cover?.description || '').trim(),
      category: (cover?.category || '').trim(),
      imageUrl: (cover?.imageUrl || '').trim(),
      level: (cover?.level || '').trim()
    },
    levels: (draftLevels || []).map((levelItem, levelIndex) => ({
      levelIndex,
      title: (levelItem?.title || '').trim(),
      sublevels: (levelItem?.sublevels || []).map((sublevel, sublevelIndex) => ({
        sublevelIndex,
        existingId: sublevel?.existingId || '',
        title: (sublevel?.title || '').trim(),
        contentText: (sublevel?.contentText || '').trim(),
        videoUrls: (sublevel?.videoUrls || []).map((item) => item.trim()).filter(Boolean),
        pdfUrl: (sublevel?.pdfUrl || '').trim(),
        imageItems: (sublevel?.imageItems || [])
          .map((imageItem) => ({
            sourceType: imageItem?.sourceType || 'url',
            url: (imageItem?.url || '').trim(),
            context: (imageItem?.context || '').trim(),
            fileName: imageItem?.file?.name || ''
          }))
          .filter((item) => item.url || item.fileName)
      }))
    }))
  });

const revokeSublevelImages = (sublevels) => {
  (sublevels || []).forEach((sublevel) => {
    (sublevel.imageItems || []).forEach((imageItem) => {
      if (imageItem?.sourceType === 'file' && imageItem.previewUrl) {
        URL.revokeObjectURL(imageItem.previewUrl);
      }
    });
  });
};

export default function ModuleEditor() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [editorMode, setEditorMode] = useState('create');
  const [editorLoading, setEditorLoading] = useState(false);
  const [baselineDraftSignature, setBaselineDraftSignature] = useState('');
  const [baselineSublevelIds, setBaselineSublevelIds] = useState([]);
  const [coverForm, setCoverForm] = useState(INITIAL_COVER_FORM);
  const [createStep, setCreateStep] = useState(1);
  const [coverTriedContinue, setCoverTriedContinue] = useState(false);
  const [draftLevels, setDraftLevels] = useState([createInitialDraftLevel()]);
  const [activeDraftLevelIndex, setActiveDraftLevelIndex] = useState(0);
  const [activeDraftSublevelIndex, setActiveDraftSublevelIndex] = useState(0);
  const [publishTried, setPublishTried] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [publishingDraft, setPublishingDraft] = useState(false);
  const draftLevelsRef = useRef(draftLevels);

  const isEditingMode = editorMode === 'edit';
  const currentDraftSignature = serializeDraftState(coverForm, draftLevels);
  const createDefaultSignature = serializeDraftState(INITIAL_COVER_FORM, [createInitialDraftLevel()]);

  useEffect(() => {
    draftLevelsRef.current = draftLevels;
  }, [draftLevels]);

  useEffect(
    () => () => {
      draftLevelsRef.current.forEach((levelItem) => revokeSublevelImages(levelItem.sublevels));
    },
    []
  );

  useEffect(() => {
    const moduleId = searchParams.get('moduleId');
    if (!moduleId) {
      setEditorMode('create');
      setBaselineSublevelIds([]);
      const initialLevels = [createInitialDraftLevel()];
      setDraftLevels(initialLevels);
      setBaselineDraftSignature(serializeDraftState(INITIAL_COVER_FORM, initialLevels));
      setCoverForm(INITIAL_COVER_FORM);
      setActiveDraftLevelIndex(0);
      setActiveDraftSublevelIndex(0);
      setCreateStep(1);
      setCoverTriedContinue(false);
      setPublishTried(false);
      return;
    }

    const hydrateEditor = async () => {
      setEditorMode('edit');
      setEditorLoading(true);
      try {
        const res = await modulesApi.get(moduleId);
        const moduleItem = res.data?.module || {};
        const fetchedLevels = Array.isArray(res.data?.levels) ? res.data.levels : [];

        const nextCover = {
          title: moduleItem.title || '',
          description: moduleItem.description || '',
          category: moduleItem.category || 'General',
          imageUrl: moduleItem.imageUrl || '',
          level: moduleItem.level || 'Básico'
        };

        const hydratedDraftLevels = hydrateDraftLevels(fetchedLevels);
        setCoverForm(nextCover);
        setDraftLevels(hydratedDraftLevels);
        setActiveDraftLevelIndex(0);
        setActiveDraftSublevelIndex(0);
        setCreateStep(1);
        setCoverTriedContinue(false);
        setPublishTried(false);
        setBaselineSublevelIds(fetchedLevels.map((item) => item._id).filter(Boolean));
        setBaselineDraftSignature(serializeDraftState(nextCover, hydratedDraftLevels));
      } finally {
        setEditorLoading(false);
      }
    };

    hydrateEditor();
  }, [searchParams]);

  const isCoverValid =
    coverForm.title.trim() &&
    coverForm.category.trim() &&
    coverForm.description.trim() &&
    coverForm.level.trim();

  const coverErrors = {
    title: !coverForm.title.trim(),
    category: !coverForm.category.trim(),
    description: !coverForm.description.trim(),
    level: !coverForm.level.trim()
  };

  const hasCreateChanges = isEditingMode
    ? Boolean(baselineDraftSignature) && currentDraftSignature !== baselineDraftSignature
    : currentDraftSignature !== createDefaultSignature;

  const isDraftSublevelValid = (sublevel) => sublevel.title.trim() && sublevel.contentText.trim();

  const isDraftLevelValid = (levelItem) =>
    levelItem.title.trim() &&
    Array.isArray(levelItem.sublevels) &&
    levelItem.sublevels.length > 0 &&
    levelItem.sublevels.every(isDraftSublevelValid);

  const hasMandatoryFirstSublevel = Boolean(draftLevels[0]?.sublevels?.[0]);
  const allDraftLevelsValid = draftLevels.length > 0 && hasMandatoryFirstSublevel && draftLevels.every(isDraftLevelValid);

  const activeLevel = draftLevels[activeDraftLevelIndex] || null;
  const activeSublevel = activeLevel?.sublevels?.[activeDraftSublevelIndex] || null;

  const updateDraftLevel = (levelIndex, updater) => {
    setDraftLevels((prev) => prev.map((levelItem, idx) => (idx === levelIndex ? updater(levelItem) : levelItem)));
  };

  const updateDraftSublevel = (levelIndex, sublevelIndex, updater) => {
    updateDraftLevel(levelIndex, (levelItem) => ({
      ...levelItem,
      sublevels: levelItem.sublevels.map((sublevel, idx) => (idx === sublevelIndex ? updater(sublevel) : sublevel))
    }));
  };

  const addDraftLevel = () => {
    setDraftLevels((prev) => {
      const next = [...prev, createInitialDraftLevel()];
      setActiveDraftLevelIndex(next.length - 1);
      setActiveDraftSublevelIndex(0);
      return next;
    });
  };

  const removeDraftLevel = (levelIndex) => {
    if (levelIndex === 0 || draftLevels.length <= 1) return;
    revokeSublevelImages(draftLevels[levelIndex]?.sublevels || []);

    setDraftLevels((prev) => prev.filter((_, idx) => idx !== levelIndex));
    setActiveDraftLevelIndex((prevLevelIndex) => {
      if (prevLevelIndex === levelIndex) return Math.max(0, levelIndex - 1);
      if (prevLevelIndex > levelIndex) return prevLevelIndex - 1;
      return prevLevelIndex;
    });
    setActiveDraftSublevelIndex(0);
  };

  const addDraftSublevel = (levelIndex = activeDraftLevelIndex) => {
    updateDraftLevel(levelIndex, (levelItem) => ({
      ...levelItem,
      sublevels: [...levelItem.sublevels, createInitialDraftSublevel()]
    }));

    setActiveDraftLevelIndex(levelIndex);
    setActiveDraftSublevelIndex((draftLevels[levelIndex]?.sublevels?.length || 0));
  };

  const removeDraftSublevel = (levelIndex, sublevelIndex) => {
    const levelItem = draftLevels[levelIndex];
    if (!levelItem) return;
    if (levelItem.sublevels.length <= 1) return;
    if (levelIndex === 0 && sublevelIndex === 0) return;

    const removedSublevel = levelItem.sublevels[sublevelIndex];
    revokeSublevelImages([removedSublevel]);

    updateDraftLevel(levelIndex, (prev) => ({
      ...prev,
      sublevels: prev.sublevels.filter((_, idx) => idx !== sublevelIndex)
    }));

    if (activeDraftLevelIndex === levelIndex) {
      setActiveDraftSublevelIndex((prev) => {
        if (prev === sublevelIndex) return Math.max(0, sublevelIndex - 1);
        if (prev > sublevelIndex) return prev - 1;
        return prev;
      });
    }
  };

  const addVideoField = (levelIndex, sublevelIndex) => {
    updateDraftSublevel(levelIndex, sublevelIndex, (sublevel) => ({
      ...sublevel,
      videoUrls: [...sublevel.videoUrls, '']
    }));
  };

  const addImageUrlField = (levelIndex, sublevelIndex) => {
    updateDraftSublevel(levelIndex, sublevelIndex, (sublevel) => ({
      ...sublevel,
      imageItems: [
        ...sublevel.imageItems,
        {
          id: createId(),
          sourceType: 'url',
          url: '',
          context: '',
          file: null,
          previewUrl: ''
        }
      ]
    }));
  };

  const addImageFiles = (levelIndex, sublevelIndex, files) => {
    if (!files?.length) return;

    updateDraftSublevel(levelIndex, sublevelIndex, (sublevel) => ({
      ...sublevel,
      imageItems: [
        ...sublevel.imageItems,
        ...files.map((file) => ({
          id: createId(),
          sourceType: 'file',
          url: '',
          context: '',
          file,
          previewUrl: URL.createObjectURL(file)
        }))
      ]
    }));
  };

  const removeImageItem = (levelIndex, sublevelIndex, imageId) => {
    updateDraftSublevel(levelIndex, sublevelIndex, (sublevel) => {
      const imageToRemove = sublevel.imageItems.find((imageItem) => imageItem.id === imageId);
      if (imageToRemove?.sourceType === 'file' && imageToRemove.previewUrl) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }

      return {
        ...sublevel,
        imageItems: sublevel.imageItems.filter((imageItem) => imageItem.id !== imageId)
      };
    });
  };

  const exitCreateFlow = () => {
    if (location.pathname.startsWith('/admin')) {
      navigate('/admin/modules');
      return;
    }
    navigate('/teacher/modules');
  };

  const cancelCreateFlow = () => {
    if (hasCreateChanges) {
      setShowDiscardModal(true);
      return;
    }
    exitCreateFlow();
  };

  const buildSublevelPayload = async (sublevel, order, levelNumber, sublevelNumber, levelTitle) => {
    const trimmedVideoUrls = (sublevel.videoUrls || []).map((item) => item.trim()).filter(Boolean);
    const imageItems = [];

    for (const imageItem of sublevel.imageItems || []) {
      const context = (imageItem?.context || '').trim();

      if (imageItem?.sourceType === 'url') {
        const url = (imageItem?.url || '').trim();
        if (url) imageItems.push({ url, context });
        continue;
      }

      if (imageItem?.sourceType === 'file' && imageItem.file) {
        const dataUrl = await fileToDataUrl(imageItem.file);
        if (dataUrl) imageItems.push({ url: dataUrl, context });
      }
    }

    return {
      order,
      levelNumber,
      sublevelNumber,
      levelTitle: levelTitle.trim() || `Nivel ${levelNumber}`,
      title: sublevel.title,
      contentText: sublevel.contentText,
      videoUrl: trimmedVideoUrls[0] || '',
      resources: [
        ...trimmedVideoUrls.slice(1).map((url) => `video:${url}`),
        ...(sublevel.pdfUrl.trim() ? [`pdf:${sublevel.pdfUrl.trim()}`] : [])
      ],
      imageItems,
      contextForAI: ''
    };
  };

  const publishDraft = async () => {
    setPublishTried(true);
    if (!isCoverValid || !allDraftLevelsValid || publishingDraft) return;

    setPublishingDraft(true);
    try {
      if (isEditingMode) {
        const moduleId = searchParams.get('moduleId');
        if (!moduleId) throw new Error('No se encontro el modulo a editar');

        await modulesApi.update(moduleId, {
          title: coverForm.title,
          description: coverForm.description,
          category: coverForm.category,
          imageUrl: coverForm.imageUrl,
          level: coverForm.level
        });

        const currentExistingIds = draftLevels
          .flatMap((levelItem) => levelItem.sublevels)
          .map((sublevel) => sublevel.existingId)
          .filter(Boolean);

        const removedIds = baselineSublevelIds.filter((id) => !currentExistingIds.includes(id));

        for (const removedId of removedIds) {
          await modulesApi.removeLevel(moduleId, removedId);
        }

        let order = 1;
        for (let levelIndex = 0; levelIndex < draftLevels.length; levelIndex += 1) {
          const levelItem = draftLevels[levelIndex];

          for (let sublevelIndex = 0; sublevelIndex < levelItem.sublevels.length; sublevelIndex += 1) {
            const sublevel = levelItem.sublevels[sublevelIndex];
            const payload = await buildSublevelPayload(
              sublevel,
              order,
              levelIndex + 1,
              sublevelIndex + 1,
              levelItem.title
            );

            if (sublevel.existingId) {
              await modulesApi.updateLevel(moduleId, sublevel.existingId, payload);
            } else {
              await modulesApi.addLevel(moduleId, payload);
            }

            order += 1;
          }
        }
      } else {
        const createRes = await modulesApi.create({
          ...coverForm,
          isPublished: false
        });

        const moduleId = createRes.data?.module?._id;
        if (!moduleId) throw new Error('No se pudo crear el modulo');

        let order = 1;
        for (let levelIndex = 0; levelIndex < draftLevels.length; levelIndex += 1) {
          const levelItem = draftLevels[levelIndex];

          for (let sublevelIndex = 0; sublevelIndex < levelItem.sublevels.length; sublevelIndex += 1) {
            const sublevel = levelItem.sublevels[sublevelIndex];
            const payload = await buildSublevelPayload(
              sublevel,
              order,
              levelIndex + 1,
              sublevelIndex + 1,
              levelItem.title
            );

            await modulesApi.addLevel(moduleId, payload);
            order += 1;
          }
        }

        await modulesApi.update(moduleId, { isPublished: true });
      }

      exitCreateFlow();
    } finally {
      setPublishingDraft(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="px-1">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className={createStep === 1 ? 'text-brand-200' : 'text-emerald-300'}>1. Portada</span>
          <span className={createStep === 2 ? 'text-brand-200' : 'text-slate-400'}>2. Niveles y subniveles</span>
        </div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full bg-gradient-to-r from-brand-500 to-cyan-400 transition-all duration-300 ${createStep === 1 ? 'w-1/2' : 'w-full'}`}
          />
        </div>
      </div>

      <Card className="border-slate-800 bg-slate-900/45">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-white">{isEditingMode ? 'Editar modulo' : 'Crear nuevo modulo'}</h2>
              <p className="mt-1 text-sm text-slate-300">Completa la portada y luego configura niveles con sus subniveles.</p>
            </div>
            <button
              type="button"
              onClick={cancelCreateFlow}
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800/50"
            >
              Cancelar y salir
            </button>
          </div>

          {editorLoading ? (
            <div className="rounded-xl border border-slate-700 bg-slate-900/35 p-6 text-sm text-slate-300">Cargando datos del modulo...</div>
          ) : createStep === 1 ? (
            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-medium text-slate-200">
                  Titulo
                  <input
                    className={`rounded-lg border bg-slate-900 px-3 py-2 text-sm outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-400/30 ${coverTriedContinue && coverErrors.title ? 'border-red-400/70' : 'border-slate-700'}`}
                    placeholder="Ej: Introduccion a Sensores"
                    value={coverForm.title}
                    onChange={(e) => setCoverForm((f) => ({ ...f, title: e.target.value }))}
                  />
                  <span className="text-[11px] text-slate-400">Nombre claro y corto.</span>
                  {coverTriedContinue && coverErrors.title && <span className="text-xs text-red-300">El titulo es obligatorio.</span>}
                </label>

                <label className="grid gap-1.5 text-sm font-medium text-slate-200">
                  Categoria
                  <input
                    className={`rounded-lg border bg-slate-900 px-3 py-2 text-sm outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-400/30 ${coverTriedContinue && coverErrors.category ? 'border-red-400/70' : 'border-slate-700'}`}
                    placeholder="Ej: General"
                    value={coverForm.category}
                    onChange={(e) => setCoverForm((f) => ({ ...f, category: e.target.value }))}
                  />
                  <span className="text-[11px] text-slate-400">Ayuda a organizar modulos.</span>
                  {coverTriedContinue && coverErrors.category && <span className="text-xs text-red-300">La categoria es obligatoria.</span>}
                </label>

                <label className="md:col-span-2 grid gap-1.5 text-sm font-medium text-slate-200">
                  Dificultad
                  <select
                    className={`rounded-lg border bg-slate-900 px-3 py-2 text-sm outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-400/30 ${coverTriedContinue && coverErrors.level ? 'border-red-400/70' : 'border-slate-700'}`}
                    value={coverForm.level}
                    onChange={(e) => setCoverForm((f) => ({ ...f, level: e.target.value }))}
                  >
                    <option>Básico</option>
                    <option>Intermedio</option>
                    <option>Avanzado</option>
                  </select>
                </label>

                <label className="md:col-span-2 grid gap-1.5 text-sm font-medium text-slate-200">
                  Descripcion
                  <textarea
                    className={`rounded-lg border bg-slate-900 px-3 py-2 text-sm outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-400/30 ${coverTriedContinue && coverErrors.description ? 'border-red-400/70' : 'border-slate-700'}`}
                    rows={4}
                    placeholder="Explica que aprendera el estudiante"
                    value={coverForm.description}
                    onChange={(e) => setCoverForm((f) => ({ ...f, description: e.target.value }))}
                  />
                  <span className="text-[11px] text-slate-400">Resumen breve del objetivo del modulo.</span>
                  {coverTriedContinue && coverErrors.description && <span className="text-xs text-red-300">La descripcion es obligatoria.</span>}
                </label>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/55 p-4">
                <p className="text-sm font-semibold text-slate-100">Vista previa de portada</p>
                <div className="mt-3 overflow-hidden rounded-xl border border-slate-700 bg-slate-900/70">
                  <div className="h-36 w-full bg-slate-800">
                    <img
                      src={coverForm.imageUrl || '/assets/campus-placeholder.svg'}
                      alt="Vista previa portada"
                      onError={(e) => {
                        e.currentTarget.src = '/assets/campus-placeholder.svg';
                      }}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="space-y-2 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="line-clamp-1 text-sm font-bold text-white">{coverForm.title || 'Titulo del modulo'}</h4>
                      <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] text-slate-200">{coverForm.level || 'Nivel'}</span>
                    </div>
                    <p className="line-clamp-2 text-xs text-slate-300">{coverForm.description || 'La descripcion del modulo aparecera aqui.'}</p>
                    <p className="text-[11px] text-slate-400">Categoria: {coverForm.category || 'General'}</p>
                  </div>
                </div>

                <label className="mt-3 grid gap-1.5 text-sm font-medium text-slate-200">
                  Imagen de portada (URL)
                  <input
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-400/30"
                    placeholder="https://..."
                    value={coverForm.imageUrl}
                    onChange={(e) => setCoverForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[300px_1fr] pb-24">
              <aside className="rounded-xl border border-slate-800 bg-slate-900/25 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Niveles</p>
                  <button
                    type="button"
                    onClick={addDraftLevel}
                    className="rounded-lg bg-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-100"
                  >
                    + Nivel
                  </button>
                </div>

                <div className="mt-3 space-y-3">
                  {draftLevels.map((levelItem, levelIndex) => {
                    const isActiveLevel = activeDraftLevelIndex === levelIndex;
                    const isLevelValid = isDraftLevelValid(levelItem);

                    return (
                      <div key={`editor-level-${levelIndex + 1}`} className={`rounded-lg border ${isActiveLevel ? 'border-brand-400/40 bg-brand-500/10' : 'border-slate-700/70 bg-slate-900/45'}`}>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDraftLevelIndex(levelIndex);
                            setActiveDraftSublevelIndex(0);
                          }}
                          className="w-full px-3 py-2 text-left"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-semibold text-slate-100">Nivel {levelIndex + 1}</span>
                            <span className={`inline-block h-2.5 w-2.5 rounded-full ${isLevelValid ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                          </div>
                          <p className="mt-0.5 truncate text-xs text-slate-400">{levelItem.title || 'Sin titulo de nivel'}</p>
                        </button>

                        <div className="border-t border-slate-700/70 px-2 py-2">
                          <div className="space-y-1">
                            {levelItem.sublevels.map((sublevel, sublevelIndex) => {
                              const isActiveSublevel =
                                activeDraftLevelIndex === levelIndex && activeDraftSublevelIndex === sublevelIndex;

                              return (
                                <button
                                  key={`editor-sublevel-${levelIndex + 1}-${sublevelIndex + 1}`}
                                  type="button"
                                  onClick={() => {
                                    setActiveDraftLevelIndex(levelIndex);
                                    setActiveDraftSublevelIndex(sublevelIndex);
                                  }}
                                  className={`w-full rounded-md px-2 py-1.5 text-left text-xs transition ${isActiveSublevel ? 'bg-cyan-500/20 text-cyan-100' : 'text-slate-300 hover:bg-slate-800/70'}`}
                                >
                                  {levelIndex + 1}.{sublevelIndex + 1} {sublevel.title || 'Subnivel sin titulo'}
                                </button>
                              );
                            })}
                          </div>

                          <button
                            type="button"
                            onClick={() => addDraftSublevel(levelIndex)}
                            className="mt-2 w-full rounded-md bg-slate-700/80 px-2 py-1.5 text-xs font-semibold text-slate-100"
                          >
                            + Agregar subnivel
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </aside>

              {activeLevel && activeSublevel && (
                <section className="rounded-xl border border-slate-800 bg-slate-900/25 p-4">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-100">Editando nivel {activeDraftLevelIndex + 1} / subnivel {activeDraftLevelIndex + 1}.{activeDraftSublevelIndex + 1}</h3>
                    <div className="flex flex-wrap items-center gap-2">
                      {draftLevels.length > 1 && activeDraftLevelIndex > 0 && (
                        <button
                          type="button"
                          onClick={() => removeDraftLevel(activeDraftLevelIndex)}
                          className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-200"
                        >
                          Eliminar nivel
                        </button>
                      )}

                      {activeLevel.sublevels.length > 1 && !(activeDraftLevelIndex === 0 && activeDraftSublevelIndex === 0) && (
                        <button
                          type="button"
                          onClick={() => removeDraftSublevel(activeDraftLevelIndex, activeDraftSublevelIndex)}
                          className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-200"
                        >
                          Eliminar subnivel
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-6">
                    <div className="space-y-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Configuracion del nivel</p>
                      <label className="grid gap-1 text-sm font-medium text-slate-200">
                        Titulo del nivel *
                        <input
                          className={`rounded-lg border bg-slate-900 px-3 py-2 text-sm outline-none transition focus:border-brand-400 ${publishTried && !activeLevel.title.trim() ? 'border-red-400/70' : 'border-slate-700'}`}
                          placeholder={`Ej: Nivel ${activeDraftLevelIndex + 1}`}
                          value={activeLevel.title}
                          onChange={(e) =>
                            updateDraftLevel(activeDraftLevelIndex, (prev) => ({
                              ...prev,
                              title: e.target.value
                            }))
                          }
                        />
                        {publishTried && !activeLevel.title.trim() && <span className="text-xs text-red-300">El titulo del nivel es obligatorio.</span>}
                      </label>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Contenido del subnivel</p>
                      <label className="grid gap-1 text-sm font-medium text-slate-200">
                        Titulo del subnivel *
                        <input
                          className={`rounded-lg border bg-slate-900 px-3 py-2 text-sm outline-none transition focus:border-brand-400 ${publishTried && !activeSublevel.title.trim() ? 'border-red-400/70' : 'border-slate-700'}`}
                          placeholder={`Ej: Subnivel ${activeDraftLevelIndex + 1}.${activeDraftSublevelIndex + 1}`}
                          value={activeSublevel.title}
                          onChange={(e) =>
                            updateDraftSublevel(activeDraftLevelIndex, activeDraftSublevelIndex, (prev) => ({
                              ...prev,
                              title: e.target.value
                            }))
                          }
                        />
                        {publishTried && !activeSublevel.title.trim() && <span className="text-xs text-red-300">El titulo del subnivel es obligatorio.</span>}
                      </label>

                      <label className="grid gap-1 text-sm font-medium text-slate-200">
                        Instrucciones *
                        <textarea
                          className={`rounded-lg border bg-slate-900 px-3 py-2 text-sm outline-none transition focus:border-brand-400 ${publishTried && !activeSublevel.contentText.trim() ? 'border-red-400/70' : 'border-slate-700'}`}
                          rows={5}
                          placeholder="Escribe las instrucciones del subnivel"
                          value={activeSublevel.contentText}
                          onChange={(e) =>
                            updateDraftSublevel(activeDraftLevelIndex, activeDraftSublevelIndex, (prev) => ({
                              ...prev,
                              contentText: e.target.value
                            }))
                          }
                        />
                        {publishTried && !activeSublevel.contentText.trim() && <span className="text-xs text-red-300">Las instrucciones son obligatorias.</span>}
                      </label>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Imagenes y contexto</p>
                        <span className="text-xs text-slate-400">Total: {activeSublevel.imageItems.length}</span>
                      </div>

                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-200">Album de imagenes</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => addImageUrlField(activeDraftLevelIndex, activeDraftSublevelIndex)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-slate-100"
                            title="Agregar URL de imagen"
                          >
                            <Link2 className="h-3.5 w-3.5" />
                          </button>
                          <label className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-700 text-slate-100" title="Subir imagen">
                            <Upload className="h-3.5 w-3.5" />
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(e) => {
                                addImageFiles(activeDraftLevelIndex, activeDraftSublevelIndex, Array.from(e.target.files || []));
                                e.currentTarget.value = '';
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {activeSublevel.imageItems.length ? (
                        <div className="grid gap-2">
                          {activeSublevel.imageItems.map((imageItem, imageIndex) => {
                            const imageSrc = imageItem.sourceType === 'file' ? imageItem.previewUrl : imageItem.url;

                            return (
                              <div key={imageItem.id} className="rounded-lg border border-slate-700 bg-slate-900/80 p-2">
                                <div className="mb-2 flex items-center justify-between">
                                  <span className="text-xs text-slate-300">
                                    Imagen {imageIndex + 1} ({imageItem.sourceType === 'file' ? 'archivo' : 'URL'})
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeImageItem(activeDraftLevelIndex, activeDraftSublevelIndex, imageItem.id)}
                                    className="rounded bg-slate-700 px-2 py-1 text-[11px] text-slate-200"
                                  >
                                    Quitar
                                  </button>
                                </div>

                                {imageItem.sourceType === 'url' && (
                                  <input
                                    className="mb-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none transition focus:border-brand-400"
                                    placeholder="https://..."
                                    value={imageItem.url}
                                    onChange={(e) =>
                                      updateDraftSublevel(activeDraftLevelIndex, activeDraftSublevelIndex, (prev) => ({
                                        ...prev,
                                        imageItems: prev.imageItems.map((candidate) =>
                                          candidate.id === imageItem.id ? { ...candidate, url: e.target.value } : candidate
                                        )
                                      }))
                                    }
                                  />
                                )}

                                <div className="mb-2 overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
                                  {imageSrc ? (
                                    <img
                                      src={imageSrc}
                                      alt={`Preview imagen ${imageIndex + 1}`}
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                      className="h-28 w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-28 items-center justify-center text-xs text-slate-400">Sin preview</div>
                                  )}
                                </div>

                                <textarea
                                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none transition focus:border-brand-400"
                                  rows={2}
                                  placeholder="Contexto de la imagen para el estudiante"
                                  value={imageItem.context}
                                  onChange={(e) =>
                                    updateDraftSublevel(activeDraftLevelIndex, activeDraftSublevelIndex, (prev) => ({
                                      ...prev,
                                      imageItems: prev.imageItems.map((candidate) =>
                                        candidate.id === imageItem.id ? { ...candidate, context: e.target.value } : candidate
                                      )
                                    }))
                                  }
                                />
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-slate-700 px-3 py-4 text-sm text-slate-400">
                          Este subnivel no tiene imagenes aun.
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-200">Videos de YouTube (opcional)</span>
                        <button
                          type="button"
                          onClick={() => addVideoField(activeDraftLevelIndex, activeDraftSublevelIndex)}
                          disabled={
                            activeSublevel.videoUrls.length > 0 &&
                            !activeSublevel.videoUrls[activeSublevel.videoUrls.length - 1].trim()
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                          title="Agregar video"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="mt-2 grid gap-2">
                        {activeSublevel.videoUrls.map((videoUrl, videoIndex) => (
                          <div key={`video-${activeDraftLevelIndex + 1}-${activeDraftSublevelIndex + 1}-${videoIndex + 1}`} className="grid gap-2 sm:grid-cols-[1fr_120px]">
                            <div className="flex gap-2">
                              <input
                                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none transition focus:border-brand-400"
                                placeholder="https://www.youtube.com/..."
                                value={videoUrl}
                                onChange={(e) =>
                                  updateDraftSublevel(activeDraftLevelIndex, activeDraftSublevelIndex, (prev) => ({
                                    ...prev,
                                    videoUrls: prev.videoUrls.map((candidate, idx) => (idx === videoIndex ? e.target.value : candidate))
                                  }))
                                }
                              />
                              {activeSublevel.videoUrls.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateDraftSublevel(activeDraftLevelIndex, activeDraftSublevelIndex, (prev) => ({
                                      ...prev,
                                      videoUrls: prev.videoUrls.filter((_, idx) => idx !== videoIndex)
                                    }))
                                  }
                                  className="rounded-lg bg-slate-700 px-2.5 text-xs"
                                >
                                  Quitar
                                </button>
                              )}
                            </div>

                            <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
                              {getYouTubeThumbnail(videoUrl) ? (
                                <img src={getYouTubeThumbnail(videoUrl)} alt="Preview YouTube" className="h-14 w-full object-cover" />
                              ) : (
                                <div className="flex h-14 items-center justify-center gap-1 text-[11px] text-slate-400">
                                  <Video className="h-3.5 w-3.5" />
                                  Sin preview
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Recursos extra</p>
                      <label className="grid gap-1 text-sm font-medium text-slate-200">
                        PDF de apoyo (enlace)
                        <input
                          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none transition focus:border-brand-400"
                          placeholder="https://..."
                          value={activeSublevel.pdfUrl}
                          onChange={(e) =>
                            updateDraftSublevel(activeDraftLevelIndex, activeDraftSublevelIndex, (prev) => ({
                              ...prev,
                              pdfUrl: e.target.value
                            }))
                          }
                        />
                      </label>
                    </div>
                  </div>
                </section>
              )}

              {publishTried && !allDraftLevelsValid && (
                <p className="lg:col-span-2 text-xs text-amber-300">Para {isEditingMode ? 'guardar' : 'publicar'}, completa titulo de nivel, titulo de subnivel e instrucciones en todos los subniveles.</p>
              )}
            </div>
          )}

          <div className="sticky bottom-3 z-20 rounded-xl border border-slate-700 bg-slate-950/90 p-3 shadow-lg backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {createStep === 1 ? (
                <>
                  <span className="text-xs text-slate-400">Completa la portada para pasar al paso 2.</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCoverTriedContinue(true);
                      if (!isCoverValid) return;
                      setCreateStep(2);
                    }}
                    className="rounded-lg bg-gradient-to-r from-brand-500 to-cyan-400 px-4 py-2 text-sm font-bold text-white shadow-md shadow-brand-500/25"
                  >
                    Continuar a niveles
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => setCreateStep(1)} className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800/40">
                    Volver a portada
                  </button>
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={addDraftLevel} className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-100">
                      <span className="inline-flex items-center gap-1"><Layers3 className="h-4 w-4" />Agregar nivel</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => addDraftSublevel(activeDraftLevelIndex)}
                      className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-100"
                    >
                      <span className="inline-flex items-center gap-1"><Plus className="h-4 w-4" />Agregar subnivel</span>
                    </button>
                    <button
                      type="button"
                      onClick={publishDraft}
                      disabled={publishingDraft}
                      className="rounded-lg bg-gradient-to-r from-brand-500 to-cyan-400 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {publishingDraft ? (isEditingMode ? 'Guardando...' : 'Publicando...') : (isEditingMode ? 'Guardar cambios' : 'Finalizar y publicar')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Modal open={showDiscardModal} onClose={() => setShowDiscardModal(false)}>
        <h3 className="text-lg font-bold">Descartar cambios</h3>
        <p className="mt-2 text-sm text-slate-300">
          Tienes cambios sin guardar en {isEditingMode ? 'la edicion' : 'la creacion'} del modulo. Si sales ahora, se perderan.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => setShowDiscardModal(false)}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-100"
          >
            Seguir editando
          </button>
          <button
            onClick={() => {
              setShowDiscardModal(false);
              exitCreateFlow();
            }}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Salir y descartar
          </button>
        </div>
      </Modal>
    </div>
  );
}
