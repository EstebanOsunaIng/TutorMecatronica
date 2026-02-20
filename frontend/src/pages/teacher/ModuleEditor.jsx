import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, CheckCircle2, ChevronLeft, ChevronRight, Circle, FileText, Link2, Loader2, Pencil, Plus, Upload, Video } from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Modal from '../../components/common/Modal.jsx';
import { modulesApi } from '../../api/modules.api.js';

const INITIAL_COVER_FORM = { title: '', description: '', category: 'General', imageUrl: '', level: 'Básico' };
const CATEGORY_OPTIONS = ['General', 'Robotica', 'Programacion', 'Electronica', 'Diseño 3D', 'Automatizacion', 'Inteligencia Artificial', 'Mecanica'];

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

  const embedMatch = input.match(/youtube\.com\/(embed|shorts|live|v)\/([^?&/]+)/i);
  if (embedMatch?.[2]) return embedMatch[2];

  return '';
};

const normalizeVideoUrl = (url) => {
  const value = String(url || '').trim();
  if (!value) return '';
  if (value.startsWith('data:video/')) return value;
  const id = getYouTubeId(value);
  if (id) return `https://www.youtube.com/watch?v=${id}`;
  return value;
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
  const [publishStepDone, setPublishStepDone] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [expandedLevels, setExpandedLevels] = useState({ 0: true });
  const [imageEditorState, setImageEditorState] = useState({
    open: false,
    levelIndex: 0,
    sublevelIndex: 0,
    imageId: ''
  });
  const [levelNameModal, setLevelNameModal] = useState({ open: false, levelIndex: 0, value: '' });
  const [instructionLinkModal, setInstructionLinkModal] = useState({ open: false, label: '', url: '' });
  const draftLevelsRef = useRef(draftLevels);
  const instructionTextareaRef = useRef(null);

  const handleCoverImageUpload = async (file) => {
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setCoverForm((f) => ({ ...f, imageUrl: dataUrl }));
    } catch {
      // ignore invalid files
    }
  };

  const isEditingMode = editorMode === 'edit';
  const currentDraftSignature = serializeDraftState(coverForm, draftLevels);
  const createDefaultSignature = serializeDraftState(INITIAL_COVER_FORM, [createInitialDraftLevel()]);

  useEffect(() => {
    draftLevelsRef.current = draftLevels;
  }, [draftLevels]);

  useEffect(() => {
    setExpandedLevels((prev) => {
      const next = {};
      draftLevels.forEach((_, idx) => {
        next[idx] = prev[idx] ?? true;
      });
      return next;
    });
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
  const flatDraftSublevels = useMemo(() => {
    const flat = [];
    draftLevels.forEach((levelItem, levelIndex) => {
      levelItem.sublevels.forEach((sublevel, sublevelIndex) => {
        flat.push({ levelIndex, sublevelIndex, levelItem, sublevel });
      });
    });
    return flat;
  }, [draftLevels]);
  const activeFlatDraftIndex = flatDraftSublevels.findIndex(
    (item) => item.levelIndex === activeDraftLevelIndex && item.sublevelIndex === activeDraftSublevelIndex
  );
  const editingImage = draftLevels[imageEditorState.levelIndex]
    ?.sublevels?.[imageEditorState.sublevelIndex]
    ?.imageItems?.find((imageItem) => imageItem.id === imageEditorState.imageId);

  const openLevelNameModal = (levelIndex) => {
    const safeIndex = Number(levelIndex) || 0;
    const currentTitle = draftLevels[safeIndex]?.title || '';
    setLevelNameModal({
      open: true,
      levelIndex: safeIndex,
      value: currentTitle
    });
  };

  const saveLevelNameFromModal = () => {
    const trimmedTitle = levelNameModal.value.trim();
    if (!trimmedTitle) return;
    updateDraftLevel(levelNameModal.levelIndex, (prev) => ({ ...prev, title: trimmedTitle }));
    setLevelNameModal({ open: false, levelIndex: 0, value: '' });
  };

  const goToDraftFlatIndex = (index) => {
    const item = flatDraftSublevels[index];
    if (!item) return;
    setActiveDraftLevelIndex(item.levelIndex);
    setActiveDraftSublevelIndex(item.sublevelIndex);
    setExpandedLevels((prev) => ({ ...prev, [item.levelIndex]: true }));
  };

  const openInstructionLinkBuilder = () => {
    const textarea = instructionTextareaRef.current;
    const currentText = activeSublevel?.contentText || '';
    let selected = '';

    if (textarea && typeof textarea.selectionStart === 'number' && typeof textarea.selectionEnd === 'number') {
      selected = currentText.slice(textarea.selectionStart, textarea.selectionEnd).trim();
    }

    setInstructionLinkModal({
      open: true,
      label: selected,
      url: ''
    });
  };

  const insertInstructionLink = () => {
    const rawUrl = instructionLinkModal.url.trim();
    if (!rawUrl) return;

    const finalUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const finalLabel = instructionLinkModal.label.trim() || 'Abrir enlace';
    const markdownLink = `[${finalLabel}](${finalUrl})`;

    const textarea = instructionTextareaRef.current;
    const currentText = activeSublevel?.contentText || '';
    const start = textarea && typeof textarea.selectionStart === 'number' ? textarea.selectionStart : currentText.length;
    const end = textarea && typeof textarea.selectionEnd === 'number' ? textarea.selectionEnd : currentText.length;
    const nextText = `${currentText.slice(0, start)}${markdownLink}${currentText.slice(end)}`;

    updateDraftSublevel(activeDraftLevelIndex, activeDraftSublevelIndex, (prev) => ({
      ...prev,
      contentText: nextText
    }));

    setInstructionLinkModal({ open: false, label: '', url: '' });

    requestAnimationFrame(() => {
      if (!instructionTextareaRef.current) return;
      const caretPosition = start + markdownLink.length;
      instructionTextareaRef.current.focus();
      instructionTextareaRef.current.setSelectionRange(caretPosition, caretPosition);
    });
  };

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
      const newLevelIndex = next.length - 1;
      setActiveDraftLevelIndex(newLevelIndex);
      setActiveDraftSublevelIndex(0);
      setLevelNameModal({ open: true, levelIndex: newLevelIndex, value: '' });
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

  const addVideoFiles = async (levelIndex, sublevelIndex, files) => {
    if (!files?.length) return;

    const dataUrls = await Promise.all(
      files.map(async (file) => {
        try {
          return await fileToDataUrl(file);
        } catch {
          return '';
        }
      })
    );

    const validUrls = dataUrls.filter(Boolean);
    if (!validUrls.length) return;

    updateDraftSublevel(levelIndex, sublevelIndex, (sublevel) => ({
      ...sublevel,
      videoUrls: [...sublevel.videoUrls, ...validUrls]
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

  const goPrevSublevel = () => {
    if (activeFlatDraftIndex <= 0) return;
    goToDraftFlatIndex(activeFlatDraftIndex - 1);
  };

  const goNextSublevel = () => {
    if (activeFlatDraftIndex >= flatDraftSublevels.length - 1) return;
    goToDraftFlatIndex(activeFlatDraftIndex + 1);
  };

  const exitCreateFlow = (noticeMessage = '') => {
    if (location.pathname.startsWith('/admin')) {
      navigate('/admin/modules', { state: noticeMessage ? { notice: noticeMessage } : undefined });
      return;
    }
    navigate('/teacher/modules', { state: noticeMessage ? { notice: noticeMessage } : undefined });
  };

  const cancelCreateFlow = () => {
    if (hasCreateChanges) {
      setShowDiscardModal(true);
      return;
    }
    exitCreateFlow();
  };

  const buildSublevelPayload = async (sublevel, order, levelNumber, sublevelNumber, levelTitle) => {
    const trimmedVideoUrls = (sublevel.videoUrls || [])
      .map((item) => normalizeVideoUrl(item))
      .filter(Boolean);
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

    setSaveError('');
    setPublishStepDone(false);
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

      setPublishStepDone(true);
      await new Promise((resolve) => setTimeout(resolve, 420));
      exitCreateFlow(isEditingMode ? 'Los cambios del modulo se guardaron correctamente.' : 'Modulo creado y publicado correctamente.');
    } catch (error) {
      setSaveError(error?.response?.data?.error || 'No fue posible guardar los cambios. Intenta de nuevo.');
    } finally {
      setPublishingDraft(false);
      setPublishStepDone(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="px-1">
        <div className="mx-auto max-w-xs">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <span className={createStep === 1 ? 'text-brand-500 dark:text-brand-200' : 'text-slate-500 dark:text-slate-400'}>Portada</span>
            <span className={createStep === 2 || publishingDraft ? 'text-brand-500 dark:text-brand-200' : 'text-slate-500 dark:text-slate-400'}>Niveles y subniveles</span>
          </div>

          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${createStep > 1 || publishingDraft || publishStepDone ? 'bg-emerald-500 text-white' : 'bg-brand-500 text-white'}`}>
              {createStep > 1 || publishingDraft || publishStepDone ? <Check className="h-4 w-4" /> : '1'}
            </span>

            <span className={`h-0.5 flex-1 rounded-full transition-all ${createStep > 1 || publishingDraft || publishStepDone ? 'bg-emerald-400' : 'bg-slate-300 dark:bg-slate-700'}`} />

            <span
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                publishStepDone
                  ? 'bg-emerald-500 text-white'
                  : publishingDraft
                    ? 'bg-cyan-500 text-white'
                    : createStep === 2
                      ? 'bg-brand-500 text-white'
                      : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {publishStepDone ? <Check className="h-4 w-4" /> : publishingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : '2'}
            </span>
          </div>
        </div>
      </div>

      <Card className="border-cyan-100 bg-white/95 dark:border-slate-800 dark:bg-slate-900/45">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{isEditingMode ? 'Editar modulo' : 'Crear nuevo modulo'}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Completa la portada y luego configura niveles con sus subniveles.</p>
            </div>
          </div>

          {editorLoading ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/35 dark:text-slate-300">Cargando datos del modulo...</div>
          ) : createStep === 1 ? (
            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                  Titulo
                  <input
                    className={`rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-400/30 dark:bg-slate-900 dark:text-slate-100 ${coverTriedContinue && coverErrors.title ? 'border-red-400/70' : 'border-slate-300 dark:border-slate-700'}`}
                    placeholder="Ej: Introduccion a Sensores"
                    value={coverForm.title}
                    onChange={(e) => setCoverForm((f) => ({ ...f, title: e.target.value }))}
                  />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Nombre claro y corto.</span>
                  {coverTriedContinue && coverErrors.title && <span className="text-xs text-red-300">El titulo es obligatorio.</span>}
                </label>

                <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                  Categoria
                  <select
                    className={`rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-400/30 dark:bg-slate-900 dark:text-slate-100 ${coverTriedContinue && coverErrors.category ? 'border-red-400/70' : 'border-slate-300 dark:border-slate-700'}`}
                    value={coverForm.category}
                    onChange={(e) => setCoverForm((f) => ({ ...f, category: e.target.value }))}
                  >
                    {!CATEGORY_OPTIONS.includes(coverForm.category) && <option value={coverForm.category}>{coverForm.category}</option>}
                    {CATEGORY_OPTIONS.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Ayuda a organizar modulos.</span>
                  {coverTriedContinue && coverErrors.category && <span className="text-xs text-red-300">La categoria es obligatoria.</span>}
                </label>

                <label className="md:col-span-2 grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                  Descripcion
                  <textarea
                    className={`rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-400/30 dark:bg-slate-900 dark:text-slate-100 ${coverTriedContinue && coverErrors.description ? 'border-red-400/70' : 'border-slate-300 dark:border-slate-700'}`}
                    rows={4}
                    placeholder="Explica que aprendera el estudiante"
                    value={coverForm.description}
                    onChange={(e) => setCoverForm((f) => ({ ...f, description: e.target.value }))}
                  />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Resumen breve del objetivo del modulo.</span>
                  {coverTriedContinue && coverErrors.description && <span className="text-xs text-red-300">La descripcion es obligatoria.</span>}
                </label>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/55">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">Vista previa de portada</p>
                <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/70">
                  <div className="h-36 w-full bg-slate-200 dark:bg-slate-800">
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
                      <h4 className="line-clamp-1 text-sm font-bold text-slate-900 dark:text-white">{coverForm.title || 'Titulo del modulo'}</h4>
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] text-slate-700 dark:bg-slate-700 dark:text-slate-200">{coverForm.level || 'Nivel'}</span>
                    </div>
                    <p className="line-clamp-2 text-xs text-slate-600 dark:text-slate-300">{coverForm.description || 'La descripcion del modulo aparecera aqui.'}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Categoria: {coverForm.category || 'General'}</p>
                  </div>
                </div>

                <label className="mt-3 grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                  Imagen de portada (URL)
                  <input
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-400/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="https://..."
                    value={coverForm.imageUrl}
                    onChange={(e) => setCoverForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  />
                </label>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
                    Subir imagen
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        await handleCoverImageUpload(e.target.files?.[0]);
                        e.currentTarget.value = '';
                      }}
                    />
                  </label>
                  {coverForm.imageUrl && (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Imagen cargada.</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[360px_1fr] pb-4">
              <aside className="rounded-2xl bg-slate-50 p-4 shadow-lg ring-1 ring-slate-200 dark:bg-slate-900/85 dark:ring-slate-700/60">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Estructura del modulo</p>
                  <button
                    type="button"
                    onClick={addDraftLevel}
                    className="rounded-md bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                  >
                    + Nivel
                  </button>
                </div>

                <div className="mt-3 space-y-5">
                  {draftLevels.map((levelItem, levelIndex) => {
                    const isExpanded = !!expandedLevels[levelIndex];
                    const isActiveLevel = activeDraftLevelIndex === levelIndex;
                    const isLevelValid = isDraftLevelValid(levelItem);

                    return (
                      <div key={`editor-level-${levelIndex + 1}`} className="rounded-2xl border border-cyan-100 bg-white/90 p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/40">
                        <div
                          className="flex cursor-pointer items-center gap-2 rounded-lg"
                          onClick={() => {
                            const nextExpanded = !isExpanded;
                            setExpandedLevels((prev) => ({ ...prev, [levelIndex]: nextExpanded }));
                            setActiveDraftLevelIndex(levelIndex);
                            if (nextExpanded) setActiveDraftSublevelIndex(0);
                          }}
                        >
                          <div className={`flex h-7 w-7 items-center justify-center rounded-full ${isLevelValid ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300'}`}>
                            {isLevelValid ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                          </div>

                          <div className="relative min-w-0 flex-1">
                            <div className={`flex w-full min-w-0 items-start gap-2 rounded-xl px-3 py-2.5 pr-16 text-left text-sm transition ${isActiveLevel ? 'bg-slate-200/70 text-slate-900 dark:bg-slate-800 dark:text-slate-100' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/80'}`}>
                              <span className="whitespace-normal break-words font-semibold leading-snug">{levelIndex + 1}. {levelItem.title || 'Sin titulo'}</span>
                            </div>

                            <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openLevelNameModal(levelIndex);
                                }}
                                className={`rounded p-1 ${isLevelValid ? 'text-slate-500 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700' : 'text-sky-500 hover:bg-slate-200 dark:text-sky-300 dark:hover:bg-slate-700'}`}
                                title={`Editar nombre del nivel ${levelIndex + 1}`}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedLevels((prev) => ({ ...prev, [levelIndex]: !isExpanded }));
                                }}
                                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                title={isExpanded ? 'Contraer nivel' : 'Expandir nivel'}
                              >
                                <ChevronRight className={`h-4 w-4 transition ${isExpanded ? 'rotate-90' : ''}`} />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className={`overflow-hidden transition-all duration-300 ease-out ${isExpanded ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}`}>
                          <div className="ml-9 mt-3.5 space-y-3 border-l-2 border-slate-200 pl-4 dark:border-slate-700">
                            {levelItem.sublevels.map((sublevel, sublevelIndex) => {
                              const isActiveSublevel =
                                activeDraftLevelIndex === levelIndex && activeDraftSublevelIndex === sublevelIndex;

                              return (
                                <button
                                  key={`editor-sublevel-${levelIndex + 1}-${sublevelIndex + 1}`}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDraftLevelIndex(levelIndex);
                                    setActiveDraftSublevelIndex(sublevelIndex);
                                  }}
                                  className={`flex w-full items-start gap-2 rounded-xl px-3.5 py-3.5 text-left text-[13px] transition ${isActiveSublevel ? 'bg-cyan-500 text-white ring-2 ring-cyan-200 shadow-[0_0_0_3px_rgba(34,211,238,0.25)] dark:bg-cyan-500 dark:text-white dark:ring-cyan-300' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900/60 dark:text-slate-300 dark:ring-slate-700/60 dark:hover:bg-slate-800/70'}`}
                                >
                                  {isDraftSublevelValid(sublevel) && levelItem.title.trim() ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                  ) : (
                                    <Circle className="h-3.5 w-3.5" />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="whitespace-normal break-words font-semibold leading-snug">{levelIndex + 1}.{sublevelIndex + 1} {sublevel.title || `Subnivel ${levelIndex + 1}.${sublevelIndex + 1}`}</p>
                                    <span className={`mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${isActiveSublevel ? 'bg-white/20 text-white' : isDraftSublevelValid(sublevel) && levelItem.title.trim() ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200' : 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200'}`}>
                                      {isDraftSublevelValid(sublevel) && levelItem.title.trim() ? 'OK' : 'Falta'}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addDraftSublevel(levelIndex);
                                  setExpandedLevels((prev) => ({ ...prev, [levelIndex]: true }));
                                }}
                              className="w-full rounded-md bg-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300 dark:bg-slate-700/85 dark:text-slate-100 dark:hover:bg-slate-600"
                            >
                              + Agregar subnivel a Nivel {levelIndex + 1}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </aside>

              {activeLevel && activeSublevel && (
                <section className="rounded-2xl border border-cyan-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/75">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Editando nivel {activeDraftLevelIndex + 1} / subnivel {activeDraftLevelIndex + 1}.{activeDraftSublevelIndex + 1}</h3>
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
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Contenido del subnivel</p>
                      <label className="grid gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                        Titulo del subnivel *
                        <input
                          className={`rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 ${publishTried && !activeSublevel.title.trim() ? 'border-red-400/70' : ''}`}
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

                      <label className="grid gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                        <div className="flex items-center justify-between gap-2">
                          <span>Instrucciones *</span>
                          <button
                            type="button"
                            onClick={openInstructionLinkBuilder}
                            className="inline-flex items-center gap-1 rounded-md bg-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                            title="Insertar enlace con texto legible"
                          >
                            <Link2 className="h-3.5 w-3.5" />
                            Insertar enlace
                          </button>
                        </div>
                        <textarea
                          ref={instructionTextareaRef}
                          className={`rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 ${publishTried && !activeSublevel.contentText.trim() ? 'border-red-400/70' : ''}`}
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
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">Tip: usa "Insertar enlace" para mostrar texto limpio en vez de pegar URLs largas.</span>
                        {publishTried && !activeSublevel.contentText.trim() && <span className="text-xs text-red-300">Las instrucciones son obligatorias.</span>}
                      </label>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Album de imagenes</p>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Total: {activeSublevel.imageItems.length}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => addImageUrlField(activeDraftLevelIndex, activeDraftSublevelIndex)}
                          className="inline-flex items-center gap-1.5 rounded-md bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                          title="Agregar imagen por URL"
                        >
                          <Link2 className="h-3.5 w-3.5" />
                          URL
                        </button>
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600" title="Subir imagenes">
                          <Upload className="h-3.5 w-3.5" />
                          Subir
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

                      {activeSublevel.imageItems.length ? (
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                          {activeSublevel.imageItems.map((imageItem, imageIndex) => {
                            const imageSrc = imageItem.sourceType === 'file' ? imageItem.previewUrl : imageItem.url;
                            const hasContext = Boolean((imageItem.context || '').trim());

                            return (
                              <button
                                key={imageItem.id}
                                type="button"
                                onClick={() =>
                                  setImageEditorState({
                                    open: true,
                                    levelIndex: activeDraftLevelIndex,
                                    sublevelIndex: activeDraftSublevelIndex,
                                    imageId: imageItem.id
                                  })
                                }
                                className="group relative overflow-hidden rounded-lg bg-white text-left shadow-md ring-1 ring-slate-200 hover:ring-brand-400/40 dark:bg-slate-900 dark:ring-slate-700/70"
                              >
                                <div className="h-24 w-full bg-slate-200 dark:bg-slate-950">
                                  {imageSrc ? (
                                    <img
                                      src={imageSrc}
                                      alt={`Preview imagen ${imageIndex + 1}`}
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full items-center justify-center text-[11px] text-slate-500 dark:text-slate-400">Sin URL</div>
                                  )}
                                </div>
                                <div className="p-2">
                                  <p className="truncate text-[11px] text-slate-600 dark:text-slate-300">
                                    Imagen {imageIndex + 1} ({imageItem.sourceType === 'file' ? 'archivo' : 'URL'})
                                  </p>
                                  <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">{hasContext ? imageItem.context : 'Click para agregar contexto'}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeImageItem(activeDraftLevelIndex, activeDraftSublevelIndex, imageItem.id);
                                  }}
                                  className="absolute right-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-slate-100 hover:bg-black"
                                >
                                  Quitar
                                </button>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                          Este subnivel no tiene imagenes aun.
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Videos (opcional)</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => addVideoField(activeDraftLevelIndex, activeDraftSublevelIndex)}
                            disabled={
                              activeSublevel.videoUrls.length > 0 &&
                              !activeSublevel.videoUrls[activeSublevel.videoUrls.length - 1].trim()
                            }
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-700 dark:text-slate-100"
                            title="Agregar video por URL"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600" title="Subir videos locales">
                            <Upload className="h-3.5 w-3.5" />
                            Subir
                            <input
                              type="file"
                              accept="video/*"
                              multiple
                              className="hidden"
                              onChange={async (e) => {
                                await addVideoFiles(activeDraftLevelIndex, activeDraftSublevelIndex, Array.from(e.target.files || []));
                                e.currentTarget.value = '';
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      <div className="mt-2 grid gap-2">
                        {activeSublevel.videoUrls.map((videoUrl, videoIndex) => {
                          const isFileVideo = videoUrl.startsWith('data:video/');
                          return (
                            <div key={`video-${activeDraftLevelIndex + 1}-${activeDraftSublevelIndex + 1}-${videoIndex + 1}`} className="grid gap-2 sm:grid-cols-[1fr_120px]">
                              {isFileVideo ? (
                                <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                  <div className="flex items-center gap-2">
                                    <Video className="h-3.5 w-3.5" />
                                    Video cargado desde archivo
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateDraftSublevel(activeDraftLevelIndex, activeDraftSublevelIndex, (prev) => ({
                                        ...prev,
                                        videoUrls: prev.videoUrls.filter((_, idx) => idx !== videoIndex)
                                      }))
                                    }
                                    className="rounded-lg bg-slate-200 px-2.5 py-1 text-[11px] text-slate-700 dark:bg-slate-700 dark:text-slate-100"
                                  >
                                    Quitar
                                  </button>
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  <input
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
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
                                      className="rounded-lg bg-slate-200 px-2.5 text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-100"
                                    >
                                      Quitar
                                    </button>
                                  )}
                                </div>
                              )}

                              <div className="overflow-hidden rounded-lg border border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
                                {isFileVideo ? (
                                  <video src={videoUrl} className="h-14 w-full object-cover" muted />
                                ) : getYouTubeThumbnail(videoUrl) ? (
                                  <img src={getYouTubeThumbnail(videoUrl)} alt="Preview YouTube" className="h-14 w-full object-cover" />
                                ) : (
                                  <div className="flex h-14 items-center justify-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                                    <Video className="h-3.5 w-3.5" />
                                    Sin preview
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Recursos extra</p>
                      <label className="grid gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                        PDF de apoyo (enlace)
                        <input
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
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

                    <div className="flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={goPrevSublevel}
                        disabled={activeFlatDraftIndex <= 0}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40 dark:border-slate-600 dark:text-slate-200"
                      >
                        <ChevronLeft className="h-4 w-4" /> Anterior
                      </button>

                      <div className="flex items-center gap-1.5">
                        {flatDraftSublevels.map((item, idx) => {
                          const complete = isDraftSublevelValid(item.sublevel) && item.levelItem.title.trim();
                          return (
                            <span
                              key={`draft-dot-${item.levelIndex + 1}-${item.sublevelIndex + 1}`}
                              className={`h-2.5 rounded-full ${idx === activeFlatDraftIndex ? 'w-7 bg-brand-500' : complete ? 'w-2.5 bg-emerald-500' : 'w-2.5 bg-sky-400'}`}
                            />
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={goNextSublevel}
                        disabled={activeFlatDraftIndex >= flatDraftSublevels.length - 1}
                        className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-brand-500 to-cyan-400 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
                      >
                        Siguiente <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {publishTried && !allDraftLevelsValid && (
                <p className="lg:col-span-2 text-xs text-rose-500 dark:text-rose-300">Para {isEditingMode ? 'guardar' : 'publicar'}, completa titulo de nivel, titulo de subnivel e instrucciones en todos los subniveles.</p>
              )}
            </div>
          )}

          <div className="mt-2 rounded-2xl bg-white/95 p-3 shadow-xl ring-1 ring-slate-200 dark:bg-slate-950/95 dark:ring-slate-700/70">
            {saveError && (
              <p className="mb-3 rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-500/20 dark:text-red-100">
                {saveError}
              </p>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {createStep === 1 ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={cancelCreateFlow}
                      className="rounded-lg bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-500/20 dark:bg-red-500/15 dark:text-red-200 dark:hover:bg-red-500/25"
                    >
                      Cancelar y salir
                    </button>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Completa la portada para pasar al paso 2.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCoverTriedContinue(true);
                      if (!isCoverValid) return;
                      setCreateStep(2);
                      if (!draftLevels[0]?.title?.trim()) {
                        setLevelNameModal({ open: true, levelIndex: 0, value: draftLevels[0]?.title || '' });
                      }
                    }}
                    className="w-full rounded-lg bg-gradient-to-r from-brand-500 to-cyan-400 px-4 py-2 text-sm font-bold text-white shadow-md shadow-brand-500/25 sm:w-auto"
                  >
                    Continuar a niveles
                  </button>
                </>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={cancelCreateFlow}
                      className="rounded-lg bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-500/20 dark:bg-red-500/15 dark:text-red-200 dark:hover:bg-red-500/25"
                    >
                      Cancelar y salir
                    </button>
                    <button type="button" onClick={() => setCreateStep(1)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800/40">
                      Volver a portada
                    </button>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        addDraftSublevel(activeDraftLevelIndex);
                        setExpandedLevels((prev) => ({ ...prev, [activeDraftLevelIndex]: true }));
                      }}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800/40"
                    >
                      Agregar subnivel
                    </button>
                    <button
                      type="button"
                      onClick={publishDraft}
                      disabled={publishingDraft}
                      className="w-full rounded-lg bg-gradient-to-r from-brand-500 to-cyan-400 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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

      <Modal
        open={imageEditorState.open && Boolean(editingImage)}
        onClose={() => setImageEditorState({ open: false, levelIndex: 0, sublevelIndex: 0, imageId: '' })}
      >
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Editar imagen del album</h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Subnivel {imageEditorState.levelIndex + 1}.{imageEditorState.sublevelIndex + 1}
        </p>

        {editingImage && (
          <div className="mt-4 space-y-3">
            {editingImage.sourceType === 'url' && (
              <label className="grid gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                URL de la imagen
                <input
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="https://..."
                  value={editingImage.url}
                  onChange={(e) =>
                    updateDraftSublevel(imageEditorState.levelIndex, imageEditorState.sublevelIndex, (prev) => ({
                      ...prev,
                      imageItems: prev.imageItems.map((candidate) =>
                        candidate.id === editingImage.id ? { ...candidate, url: e.target.value } : candidate
                      )
                    }))
                  }
                />
              </label>
            )}

            <div className="overflow-hidden rounded-lg border border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-950">
              {(editingImage.sourceType === 'file' ? editingImage.previewUrl : editingImage.url) ? (
                <img
                  src={editingImage.sourceType === 'file' ? editingImage.previewUrl : editingImage.url}
                  alt="Preview imagen"
                  className="h-52 w-full object-cover"
                />
              ) : (
                <div className="flex h-52 items-center justify-center text-sm text-slate-500 dark:text-slate-400">Sin preview disponible</div>
              )}
            </div>

            <label className="grid gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
              Contexto para el estudiante
              <textarea
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                rows={4}
                placeholder="Describe la imagen y su importancia"
                value={editingImage.context}
                onChange={(e) =>
                  updateDraftSublevel(imageEditorState.levelIndex, imageEditorState.sublevelIndex, (prev) => ({
                    ...prev,
                    imageItems: prev.imageItems.map((candidate) =>
                      candidate.id === editingImage.id ? { ...candidate, context: e.target.value } : candidate
                    )
                  }))
                }
              />
            </label>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setImageEditorState({ open: false, levelIndex: 0, sublevelIndex: 0, imageId: '' })}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Listo
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={levelNameModal.open}
        onClose={() => setLevelNameModal({ open: false, levelIndex: 0, value: '' })}
      >
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nombre del nivel {levelNameModal.levelIndex + 1}</h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Define un nombre claro para organizar mejor los subniveles.</p>
        <div className="mt-4 grid gap-1.5">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Titulo del nivel *</label>
          <input
            autoFocus
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-300/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            placeholder={`Ej: Fundamentos del nivel ${levelNameModal.levelIndex + 1}`}
            value={levelNameModal.value}
            onChange={(e) => setLevelNameModal((prev) => ({ ...prev, value: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                saveLevelNameFromModal();
              }
            }}
          />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setLevelNameModal({ open: false, levelIndex: 0, value: '' })}
            className="rounded-lg border border-slate-400 px-4 py-2 text-sm font-semibold transition hover:bg-slate-400 !bg-slate-300 !text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
          >
            Cerrar
          </button>
          <button
            type="button"
            disabled={!levelNameModal.value.trim()}
            onClick={saveLevelNameFromModal}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Guardar nombre
          </button>
        </div>
      </Modal>

      <Modal
        open={instructionLinkModal.open}
        onClose={() => setInstructionLinkModal({ open: false, label: '', url: '' })}
      >
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Insertar enlace en instrucciones</h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Escribe un texto legible y pega la URL. Se insertara como enlace clickeable.</p>

        <div className="mt-4 grid gap-3">
          <label className="grid gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
            Texto visible
            <input
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              placeholder="Ej: Enlace de descarga del Ubuntu 24.04"
              value={instructionLinkModal.label}
              onChange={(e) => setInstructionLinkModal((prev) => ({ ...prev, label: e.target.value }))}
            />
          </label>

          <label className="grid gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
            URL
            <input
              autoFocus
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              placeholder="https://..."
              value={instructionLinkModal.url}
              onChange={(e) => setInstructionLinkModal((prev) => ({ ...prev, url: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  insertInstructionLink();
                }
              }}
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setInstructionLinkModal({ open: false, label: '', url: '' })}
            className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!instructionLinkModal.url.trim()}
            onClick={insertInstructionLink}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Insertar
          </button>
        </div>
      </Modal>

      <Modal open={showDiscardModal} onClose={() => setShowDiscardModal(false)}>
        <h3 className="text-lg font-bold">Descartar cambios</h3>
        <p className="mt-2 text-sm text-slate-300">
          Tienes cambios sin guardar en {isEditingMode ? 'la edicion' : 'la creacion'} del modulo. Si sales ahora, se perderan.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => setShowDiscardModal(false)}
            className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-100"
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
