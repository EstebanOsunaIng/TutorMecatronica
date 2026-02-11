import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Layers3, Link2, Plus, Upload, Video } from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Modal from '../../components/common/Modal.jsx';
import { modulesApi } from '../../api/modules.api.js';

const INITIAL_COVER_FORM = { title: '', description: '', category: 'General', imageUrl: '', level: 'Básico' };

const createInitialDraftLevel = () => ({
  existingId: '',
  title: '',
  contentText: '',
  videoUrls: [''],
  pdfUrl: '',
  imageUrlInputs: [''],
  imageFiles: []
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

const toDraftLevel = (levelItem) => {
  const resources = Array.isArray(levelItem?.resources) ? levelItem.resources : [];
  const secondaryVideos = resources
    .filter((item) => typeof item === 'string' && item.startsWith('video:'))
    .map((item) => item.slice(6));
  const pdfUrl = resources.find((item) => typeof item === 'string' && item.startsWith('pdf:'))?.slice(4) || '';
  const imageUrlInputs = resources.filter(
    (item) => typeof item === 'string' && !item.startsWith('video:') && !item.startsWith('pdf:')
  );

  return {
    existingId: levelItem?._id || '',
    title: levelItem?.title || '',
    contentText: levelItem?.contentText || '',
    videoUrls: [levelItem?.videoUrl || '', ...secondaryVideos],
    pdfUrl,
    imageUrlInputs: imageUrlInputs.length ? imageUrlInputs : [''],
    imageFiles: []
  };
};

const serializeDraftState = (cover, draftLevels) =>
  JSON.stringify({
    cover: {
      title: (cover?.title || '').trim(),
      description: (cover?.description || '').trim(),
      category: (cover?.category || '').trim(),
      imageUrl: (cover?.imageUrl || '').trim(),
      level: cover?.level || ''
    },
    levels: (draftLevels || []).map((lvl, idx) => ({
      idx,
      existingId: lvl.existingId || '',
      title: (lvl.title || '').trim(),
      contentText: (lvl.contentText || '').trim(),
      videoUrls: (lvl.videoUrls || []).map((item) => item.trim()).filter(Boolean),
      pdfUrl: (lvl.pdfUrl || '').trim(),
      imageUrlInputs: (lvl.imageUrlInputs || []).map((item) => item.trim()).filter(Boolean),
      imageFiles: (lvl.imageFiles || []).map((fileItem) => fileItem.file?.name || '').filter(Boolean)
    }))
  });

export default function ModuleEditor() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [editorMode, setEditorMode] = useState('create');
  const [editorLoading, setEditorLoading] = useState(false);
  const [baselineDraftSignature, setBaselineDraftSignature] = useState('');
  const [baselineLevelIds, setBaselineLevelIds] = useState([]);
  const [modules, setModules] = useState([]);
  const [coverForm, setCoverForm] = useState(INITIAL_COVER_FORM);
  const [createStep, setCreateStep] = useState(1);
  const [coverTriedContinue, setCoverTriedContinue] = useState(false);
  const [draftLevels, setDraftLevels] = useState([createInitialDraftLevel()]);
  const [activeDraftLevelIndex, setActiveDraftLevelIndex] = useState(0);
  const [publishTried, setPublishTried] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [publishingDraft, setPublishingDraft] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [selected, setSelected] = useState(null);
  const [levels, setLevels] = useState([]);
  const [levelForm, setLevelForm] = useState({ title: '', contentText: '', videoUrl: '', contextForAI: '' });
  const [editingLevelId, setEditingLevelId] = useState('');
  const [busy, setBusy] = useState(false);

  const isEditingMode = editorMode === 'edit';
  const currentDraftSignature = serializeDraftState(coverForm, draftLevels);
  const createDefaultSignature = serializeDraftState(INITIAL_COVER_FORM, [createInitialDraftLevel()]);

  const load = async () => {
    const res = await modulesApi.list();
    setModules(res.data.modules || []);
  };

  const loadSelected = async (id) => {
    if (!id) {
      setSelected(null);
      setLevels([]);
      return;
    }
    const res = await modulesApi.get(id);
    setSelected({
      ...res.data.module,
      category: res.data.module?.category || 'General',
      imageUrl: res.data.module?.imageUrl || ''
    });
    setLevels(res.data.levels || []);
    setEditingLevelId('');
    setLevelForm({ title: '', contentText: '', videoUrl: '', contextForAI: '' });
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const moduleId = searchParams.get('moduleId');
    if (!moduleId) {
      setEditorMode('create');
      setBaselineLevelIds([]);
      setBaselineDraftSignature(serializeDraftState(INITIAL_COVER_FORM, [createInitialDraftLevel()]));
      return;
    }

    const hydrateEditor = async () => {
      setEditorMode('edit');
      setEditorLoading(true);
      try {
        setSelectedId(moduleId);
        const res = await modulesApi.get(moduleId);
        const moduleItem = res.data?.module || {};
        const fetchedLevels = Array.isArray(res.data?.levels) ? res.data.levels : [];
        const mappedLevels = fetchedLevels.length ? fetchedLevels.map(toDraftLevel) : [createInitialDraftLevel()];
        const nextCover = {
          title: moduleItem.title || '',
          description: moduleItem.description || '',
          category: moduleItem.category || 'General',
          imageUrl: moduleItem.imageUrl || '',
          level: moduleItem.level || 'Básico'
        };

        setSelected(moduleItem);
        setLevels(fetchedLevels);
        setCoverForm(nextCover);
        setDraftLevels(mappedLevels);
        setActiveDraftLevelIndex(0);
        setCreateStep(1);
        setCoverTriedContinue(false);
        setPublishTried(false);
        setBaselineLevelIds(fetchedLevels.map((lvl) => lvl._id).filter(Boolean));
        setBaselineDraftSignature(serializeDraftState(nextCover, mappedLevels));
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

  const isDraftLevelValid = (lvl) => lvl.title.trim() && lvl.contentText.trim();

  const allDraftLevelsValid = draftLevels.length > 0 && draftLevels.every(isDraftLevelValid);

  const updateDraftLevel = (index, updater) => {
    setDraftLevels((prev) => prev.map((lvl, i) => (i === index ? updater(lvl) : lvl)));
  };

  const addDraftLevel = () => {
    setDraftLevels((prev) => {
      const next = [...prev, createInitialDraftLevel()];
      setActiveDraftLevelIndex(next.length - 1);
      return next;
    });
  };

  const removeDraftLevel = (index) => {
    if (index === 0) return;
    setDraftLevels((prev) => prev.filter((_, i) => i !== index));
    setActiveDraftLevelIndex((prev) => {
      if (prev === index) return Math.max(0, index - 1);
      if (prev > index) return prev - 1;
      return prev;
    });
  };

  const addVideoField = (index) => {
    updateDraftLevel(index, (lvl) => ({ ...lvl, videoUrls: [...lvl.videoUrls, ''] }));
  };

  const addImageUrlField = (index) => {
    updateDraftLevel(index, (lvl) => {
      const totalImages = lvl.imageFiles.length + lvl.imageUrlInputs.length;
      if (totalImages >= 5) return lvl;
      return { ...lvl, imageUrlInputs: [...lvl.imageUrlInputs, ''] };
    });
  };

  const addImageFiles = (index, files) => {
    if (!files?.length) return;
    updateDraftLevel(index, (lvl) => {
      const availableSlots = Math.max(0, 5 - (lvl.imageFiles.length + lvl.imageUrlInputs.filter((url) => url.trim()).length));
      if (!availableSlots) return lvl;
      const pickedFiles = files.slice(0, availableSlots).map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file)
      }));
      return { ...lvl, imageFiles: [...lvl.imageFiles, ...pickedFiles] };
    });
  };

  const removeImageFile = (levelIndex, fileIndex) => {
    updateDraftLevel(levelIndex, (lvl) => ({
      ...lvl,
      imageFiles: lvl.imageFiles.filter((fileItem, i) => {
        if (i === fileIndex && fileItem?.previewUrl) URL.revokeObjectURL(fileItem.previewUrl);
        return i !== fileIndex;
      })
    }));
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

  const buildLevelPayload = async (lvl, order) => {
    const trimmedVideoUrls = (lvl.videoUrls || []).map((v) => v.trim()).filter(Boolean);
    const urlImages = (lvl.imageUrlInputs || []).map((url) => url.trim()).filter(Boolean).slice(0, 5);
    const fileImages = [];

    for (const fileItem of (lvl.imageFiles || []).slice(0, Math.max(0, 5 - urlImages.length))) {
      const dataUrl = await fileToDataUrl(fileItem.file);
      if (dataUrl) fileImages.push(dataUrl);
    }

    return {
      order,
      title: lvl.title,
      contentText: lvl.contentText,
      videoUrl: trimmedVideoUrls[0] || '',
      resources: [
        ...urlImages,
        ...fileImages,
        ...trimmedVideoUrls.slice(1).map((url) => `video:${url}`),
        ...(lvl.pdfUrl.trim() ? [`pdf:${lvl.pdfUrl.trim()}`] : [])
      ],
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

        const currentExistingIds = draftLevels.map((lvl) => lvl.existingId).filter(Boolean);
        const removedIds = baselineLevelIds.filter((id) => !currentExistingIds.includes(id));

        for (const removedId of removedIds) {
          await modulesApi.removeLevel(moduleId, removedId);
        }

        for (let i = 0; i < draftLevels.length; i += 1) {
          const lvl = draftLevels[i];
          const payload = await buildLevelPayload(lvl, i + 1);

          if (lvl.existingId) {
            await modulesApi.updateLevel(moduleId, lvl.existingId, payload);
          } else {
            await modulesApi.addLevel(moduleId, payload);
          }
        }
      } else {
        const createRes = await modulesApi.create({
          ...coverForm,
          isPublished: false
        });

        const moduleId = createRes.data?.module?._id;
        if (!moduleId) throw new Error('No se pudo crear el modulo');

        for (let i = 0; i < draftLevels.length; i += 1) {
          const lvl = draftLevels[i];
          const payload = await buildLevelPayload(lvl, i + 1);
          await modulesApi.addLevel(moduleId, payload);
        }

        await modulesApi.update(moduleId, { isPublished: true });
      }

      await load();

      if (location.pathname.startsWith('/admin')) {
        navigate('/admin/modules');
      } else {
        navigate('/teacher/modules');
      }
    } finally {
      setPublishingDraft(false);
    }
  };

  const saveModule = async () => {
    if (!selected || busy) return;
    setBusy(true);
    try {
      const res = await modulesApi.update(selected._id, {
        title: selected.title,
        description: selected.description,
        category: selected.category,
        imageUrl: selected.imageUrl,
        level: selected.level,
        isPublished: selected.isPublished
      });
      setSelected(res.data.module);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const removeModule = async (id) => {
    if (!id || busy) return;
    if (!confirm('Eliminar este modulo? Esta accion no se puede deshacer.')) return;
    setBusy(true);
    try {
      await modulesApi.remove(id);
      setSelectedId('');
      setSelected(null);
      setLevels([]);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const addLevel = async () => {
    if (!selected || busy) return;
    if (!levelForm.title.trim()) return;
    setBusy(true);
    try {
      await modulesApi.addLevel(selected._id, {
        order: levels.length + 1,
        title: levelForm.title,
        contentText: levelForm.contentText,
        videoUrl: levelForm.videoUrl,
        contextForAI: levelForm.contextForAI,
        resources: []
      });
      await loadSelected(selected._id);
    } finally {
      setBusy(false);
    }
  };

  const startEditLevel = (lvl) => {
    setEditingLevelId(lvl._id);
    setLevelForm({
      title: lvl.title || '',
      contentText: lvl.contentText || '',
      videoUrl: lvl.videoUrl || '',
      contextForAI: lvl.contextForAI || ''
    });
  };

  const saveLevel = async () => {
    if (!selected || !editingLevelId || busy) return;
    setBusy(true);
    try {
      await modulesApi.updateLevel(selected._id, editingLevelId, {
        title: levelForm.title,
        contentText: levelForm.contentText,
        videoUrl: levelForm.videoUrl,
        contextForAI: levelForm.contextForAI
      });
      await loadSelected(selected._id);
    } finally {
      setBusy(false);
    }
  };

  const removeLevel = async (lvlId) => {
    if (!selected || !lvlId || busy) return;
    if (!confirm('Eliminar este nivel?')) return;
    setBusy(true);
    try {
      await modulesApi.removeLevel(selected._id, lvlId);
      await loadSelected(selected._id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="px-1">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className={createStep === 1 ? 'text-brand-200' : 'text-emerald-300'}>1. Portada</span>
          <span className={createStep === 2 ? 'text-brand-200' : 'text-slate-400'}>2. Niveles</span>
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
              <p className="mt-1 text-sm text-slate-300">Completa primero la portada y luego agrega los niveles.</p>
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
            <div className="grid gap-4 lg:grid-cols-[250px_1fr] pb-24">
              <aside className="rounded-xl border border-slate-800 bg-slate-900/25 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Lista de niveles</p>
                <div className="mt-3 space-y-2">
                  {draftLevels.map((lvl, index) => {
                    const isLevelValid = isDraftLevelValid(lvl);
                    return (
                      <button
                        key={`level-list-${index + 1}`}
                        type="button"
                        onClick={() => setActiveDraftLevelIndex(index)}
                        className={`w-full rounded-lg border px-3 py-2 text-left transition ${activeDraftLevelIndex === index ? 'border-brand-400/40 bg-brand-500/10' : 'border-slate-700/60 bg-slate-900/45 hover:bg-slate-800/55'}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-100">Nivel {index + 1}</span>
                          <span className={`inline-block h-2.5 w-2.5 rounded-full ${isLevelValid ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                        </div>
                        <p className="mt-1 truncate text-xs text-slate-400">{lvl.title || 'Sin titulo'}</p>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={addDraftLevel}
                  className="mt-3 w-full rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-slate-100"
                >
                  + Agregar nivel
                </button>
              </aside>

              {draftLevels[activeDraftLevelIndex] && (() => {
                const lvl = draftLevels[activeDraftLevelIndex];
                const totalImages = lvl.imageFiles.length + lvl.imageUrlInputs.filter((url) => url.trim()).length;
                const canAddImageInput =
                  totalImages < 5 &&
                  (lvl.imageUrlInputs.length === 0 || lvl.imageUrlInputs[lvl.imageUrlInputs.length - 1].trim());
                const canAddVideoInput = lvl.videoUrls.length === 0 || lvl.videoUrls[lvl.videoUrls.length - 1].trim();
                const showLevelErrors = publishTried;

                return (
                  <section className="rounded-xl border border-slate-800 bg-slate-900/25 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-100">Editando nivel {activeDraftLevelIndex + 1}</h3>
                      {activeDraftLevelIndex > 0 && (
                        <button
                          type="button"
                          onClick={() => removeDraftLevel(activeDraftLevelIndex)}
                          className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-200"
                        >
                          Eliminar este nivel
                        </button>
                      )}
                    </div>

                    <div className="grid gap-6">
                      <div className="space-y-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Contenido principal</p>
                        <label className="grid gap-1 text-sm font-medium text-slate-200">
                        Titulo del nivel *
                        <input
                          className={`rounded-lg border bg-slate-900 px-3 py-2 text-sm outline-none transition focus:border-brand-400 ${showLevelErrors && !lvl.title.trim() ? 'border-red-400/70' : 'border-slate-700'}`}
                          placeholder="Ej: Que es un sensor"
                          value={lvl.title}
                          onChange={(e) => updateDraftLevel(activeDraftLevelIndex, (prev) => ({ ...prev, title: e.target.value }))}
                        />
                        {showLevelErrors && !lvl.title.trim() && <span className="text-xs text-red-300">El titulo del nivel es obligatorio.</span>}
                      </label>

                      <label className="grid gap-1 text-sm font-medium text-slate-200">
                        Contenido *
                        <textarea
                          className={`rounded-lg border bg-slate-900 px-3 py-2 text-sm outline-none transition focus:border-brand-400 ${showLevelErrors && !lvl.contentText.trim() ? 'border-red-400/70' : 'border-slate-700'}`}
                          rows={5}
                          placeholder="Escribe la explicacion principal de este nivel"
                          value={lvl.contentText}
                          onChange={(e) => updateDraftLevel(activeDraftLevelIndex, (prev) => ({ ...prev, contentText: e.target.value }))}
                        />
                        {showLevelErrors && !lvl.contentText.trim() && <span className="text-xs text-red-300">El contenido es obligatorio.</span>}
                      </label>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Multimedia</p>
                          <span className="text-xs text-slate-400">Imagenes: {totalImages}/5</span>
                        </div>

                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-200">Imagenes de apoyo</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => addImageUrlField(activeDraftLevelIndex)}
                              disabled={!canAddImageInput}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
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
                                  addImageFiles(activeDraftLevelIndex, Array.from(e.target.files || []));
                                  e.currentTarget.value = '';
                                }}
                              />
                            </label>
                          </div>
                        </div>
                        <div className="grid gap-2">
                          {lvl.imageUrlInputs.map((imgUrl, imgIndex) => (
                            <div key={`img-url-${activeDraftLevelIndex + 1}-${imgIndex + 1}`} className="grid gap-2 sm:grid-cols-[1fr_120px]">
                              <div className="flex gap-2">
                                <input
                                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none transition focus:border-brand-400"
                                  placeholder="https://..."
                                  value={imgUrl}
                                  onChange={(e) =>
                                    updateDraftLevel(activeDraftLevelIndex, (prev) => ({
                                      ...prev,
                                      imageUrlInputs: prev.imageUrlInputs.map((url, i) => (i === imgIndex ? e.target.value : url))
                                    }))
                                  }
                                />
                                {lvl.imageUrlInputs.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateDraftLevel(activeDraftLevelIndex, (prev) => ({
                                        ...prev,
                                        imageUrlInputs: prev.imageUrlInputs.filter((_, i) => i !== imgIndex)
                                      }))
                                    }
                                    className="rounded-lg bg-slate-700 px-2.5 text-xs"
                                  >
                                    Quitar
                                  </button>
                                )}
                              </div>
                              <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
                                {imgUrl.trim() ? (
                                  <img
                                    src={imgUrl}
                                    alt="Preview imagen"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                    className="h-14 w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-14 items-center justify-center text-[11px] text-slate-400">Sin preview</div>
                                )}
                              </div>
                            </div>
                          ))}

                          {lvl.imageFiles.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {lvl.imageFiles.map((fileItem, fileIndex) => (
                                <div
                                  key={`img-file-${activeDraftLevelIndex + 1}-${fileIndex + 1}`}
                                  className="overflow-hidden rounded-lg border border-slate-700 bg-slate-900"
                                >
                                  {fileItem.previewUrl ? (
                                    <img src={fileItem.previewUrl} alt={fileItem.file?.name || 'Imagen subida'} className="h-14 w-20 object-cover" />
                                  ) : (
                                    <div className="flex h-14 w-20 items-center justify-center text-[11px] text-slate-400">Imagen</div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => removeImageFile(activeDraftLevelIndex, fileIndex)}
                                    className="w-full border-t border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:text-white"
                                  >
                                    Quitar
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-200">Videos de YouTube (opcional)</span>
                          <button
                            type="button"
                            onClick={() => addVideoField(activeDraftLevelIndex)}
                            disabled={!canAddVideoInput}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                            title="Agregar video"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="mt-2 grid gap-2">
                          {lvl.videoUrls.map((video, videoIndex) => (
                            <div key={`video-${activeDraftLevelIndex + 1}-${videoIndex + 1}`} className="grid gap-2 sm:grid-cols-[1fr_120px]">
                              <div className="flex gap-2">
                                <input
                                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none transition focus:border-brand-400"
                                  placeholder="https://www.youtube.com/..."
                                  value={video}
                                  onChange={(e) =>
                                    updateDraftLevel(activeDraftLevelIndex, (prev) => ({
                                      ...prev,
                                      videoUrls: prev.videoUrls.map((url, i) => (i === videoIndex ? e.target.value : url))
                                    }))
                                  }
                                />
                                {lvl.videoUrls.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateDraftLevel(activeDraftLevelIndex, (prev) => ({
                                        ...prev,
                                        videoUrls: prev.videoUrls.filter((_, i) => i !== videoIndex)
                                      }))
                                    }
                                    className="rounded-lg bg-slate-700 px-2.5 text-xs"
                                  >
                                    Quitar
                                  </button>
                                )}
                              </div>
                              <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
                                {getYouTubeThumbnail(video) ? (
                                  <img src={getYouTubeThumbnail(video)} alt="Preview YouTube" className="h-14 w-full object-cover" />
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
                            value={lvl.pdfUrl}
                            onChange={(e) => updateDraftLevel(activeDraftLevelIndex, (prev) => ({ ...prev, pdfUrl: e.target.value }))}
                          />
                        </label>
                      </div>
                    </div>
                  </section>
                );
              })()}

              {publishTried && !allDraftLevelsValid && (
                <p className="lg:col-span-2 text-xs text-amber-300">Para {isEditingMode ? 'guardar' : 'publicar'}, completa titulo y contenido en todos los niveles.</p>
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

      {!isEditingMode && (
      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-brand-300">Modulos existentes</h3>
          <select
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm"
            value={selectedId}
            onChange={async (e) => {
              const id = e.target.value;
              setSelectedId(id);
              await loadSelected(id);
            }}
          >
            <option value="">Selecciona un modulo...</option>
            {modules.map((m) => (
              <option key={m._id} value={m._id}>
                {m.title} ({m.level})
              </option>
            ))}
          </select>
        </div>

        {selected ? (
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="rounded-lg bg-slate-900 px-3 py-2"
                value={selected.title}
                onChange={(e) => setSelected((s) => ({ ...s, title: e.target.value }))}
              />
              <input
                className="rounded-lg bg-slate-900 px-3 py-2"
                value={selected.category || ''}
                placeholder="Categoria"
                onChange={(e) => setSelected((s) => ({ ...s, category: e.target.value }))}
              />
              <select
                className="rounded-lg bg-slate-900 px-3 py-2"
                value={selected.level}
                onChange={(e) => setSelected((s) => ({ ...s, level: e.target.value }))}
              >
                <option>Básico</option>
                <option>Intermedio</option>
                <option>Avanzado</option>
              </select>
              <textarea
                className="md:col-span-2 rounded-lg bg-slate-900 px-3 py-2"
                value={selected.description}
                onChange={(e) => setSelected((s) => ({ ...s, description: e.target.value }))}
              />
              <input
                className="md:col-span-2 rounded-lg bg-slate-900 px-3 py-2"
                value={selected.imageUrl || ''}
                placeholder="Imagen URL (opcional)"
                onChange={(e) => setSelected((s) => ({ ...s, imageUrl: e.target.value }))}
              />
              <label className="flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={!!selected.isPublished}
                  onChange={(e) => setSelected((s) => ({ ...s, isPublished: e.target.checked }))}
                />
                Publicado
              </label>
              <div className="flex gap-2">
                <button
                  onClick={saveModule}
                  disabled={busy}
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold disabled:opacity-50"
                >
                  Guardar
                </button>
                <button
                  onClick={() => removeModule(selected._id)}
                  disabled={busy}
                  className="rounded-lg bg-red-500/20 px-4 py-2 text-sm font-bold text-red-200 disabled:opacity-50"
                >
                  Eliminar
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-bold uppercase tracking-widest text-brand-300">Niveles</h4>
                <div className="text-xs text-slate-400">Total: {levels.length}</div>
              </div>

              <div className="space-y-3">
                {levels.map((lvl) => (
                  <div key={lvl._id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{lvl.order}. {lvl.title}</div>
                      <div className="truncate text-xs text-slate-400">{(lvl.contentText || '').slice(0, 80)}</div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => startEditLevel(lvl)}
                        className="rounded-lg bg-brand-500/20 px-3 py-2 text-xs text-brand-200"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => removeLevel(lvl._id)}
                        className="rounded-lg bg-red-500/20 px-3 py-2 text-xs text-red-200"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-3">
                <h5 className="text-sm font-bold">{editingLevelId ? 'Editar nivel' : 'Agregar nivel'}</h5>
                <input
                  className="rounded-lg bg-slate-900 px-3 py-2"
                  placeholder="Titulo del nivel"
                  value={levelForm.title}
                  onChange={(e) => setLevelForm((f) => ({ ...f, title: e.target.value }))}
                />
                <input
                  className="rounded-lg bg-slate-900 px-3 py-2"
                  placeholder="Video URL (opcional)"
                  value={levelForm.videoUrl}
                  onChange={(e) => setLevelForm((f) => ({ ...f, videoUrl: e.target.value }))}
                />
                <textarea
                  className="rounded-lg bg-slate-900 px-3 py-2"
                  placeholder="Contenido"
                  rows={6}
                  value={levelForm.contentText}
                  onChange={(e) => setLevelForm((f) => ({ ...f, contentText: e.target.value }))}
                />
                <textarea
                  className="rounded-lg bg-slate-900 px-3 py-2"
                  placeholder="Contexto para IA (opcional)"
                  rows={3}
                  value={levelForm.contextForAI}
                  onChange={(e) => setLevelForm((f) => ({ ...f, contextForAI: e.target.value }))}
                />
                <div className="flex gap-2">
                  {editingLevelId ? (
                    <>
                      <button
                        onClick={saveLevel}
                        disabled={busy}
                        className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold disabled:opacity-50"
                      >
                        Guardar nivel
                      </button>
                      <button
                        onClick={() => {
                          setEditingLevelId('');
                          setLevelForm({ title: '', contentText: '', videoUrl: '', contextForAI: '' });
                        }}
                        className="rounded-lg bg-slate-800 px-4 py-2 text-sm"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={addLevel}
                      disabled={busy}
                      className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold disabled:opacity-50"
                    >
                      Agregar nivel
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 text-sm text-slate-400">Selecciona un modulo para editar niveles.</div>
        )}
      </Card>
      )}
    </div>
  );
}
