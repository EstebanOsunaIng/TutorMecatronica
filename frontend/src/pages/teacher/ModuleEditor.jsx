import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Card from '../../components/common/Card.jsx';
import { modulesApi } from '../../api/modules.api.js';

export default function ModuleEditor() {
  const [searchParams] = useSearchParams();
  const [modules, setModules] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', level: 'Básico' });
  const [selectedId, setSelectedId] = useState('');
  const [selected, setSelected] = useState(null);
  const [levels, setLevels] = useState([]);
  const [levelForm, setLevelForm] = useState({ title: '', contentText: '', videoUrl: '', contextForAI: '' });
  const [editingLevelId, setEditingLevelId] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [busy, setBusy] = useState(false);

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
    setSelected(res.data.module);
    setLevels(res.data.levels || []);
    setEditingLevelId('');
    setLevelForm({ title: '', contentText: '', videoUrl: '', contextForAI: '' });
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const moduleId = searchParams.get('moduleId');
    if (moduleId) {
      setSelectedId(moduleId);
      loadSelected(moduleId);
    }
  }, [searchParams]);

  const submit = async (e) => {
    e.preventDefault();
    await modulesApi.create(form);
    setForm({ title: '', description: '', level: 'Básico' });
    load();
  };

  const importPdf = async (e) => {
    e.preventDefault();
    if (!pdfFile || busy) return;
    setBusy(true);
    try {
      const res = await modulesApi.importPdf(pdfFile);
      await load();
      const id = res.data?.module?._id;
      if (id) {
        setSelectedId(id);
        await loadSelected(id);
      }
      setPdfFile(null);
    } finally {
      setBusy(false);
    }
  };

  const saveModule = async () => {
    if (!selected || busy) return;
    setBusy(true);
    try {
      const res = await modulesApi.update(selected._id, {
        title: selected.title,
        description: selected.description,
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
      <Card>
        <h2 className="text-xl font-bold text-[#173f74] dark:text-slate-100">Crear modulo</h2>
        <form onSubmit={submit} className="mt-4 grid gap-4 md:grid-cols-2">
          <input
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            placeholder="Titulo"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            spellCheck
            autoCorrect="on"
            autoCapitalize="sentences"
          />
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            value={form.level}
            onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
          >
            <option>Básico</option>
            <option>Intermedio</option>
            <option>Avanzado</option>
          </select>
          <textarea
            className="md:col-span-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            placeholder="Descripcion"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            spellCheck
            autoCorrect="on"
            autoCapitalize="sentences"
          />
          <button className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-white">Crear</button>
      </form>
    </Card>

      <Card>
        <h2 className="text-xl font-bold text-[#173f74] dark:text-slate-100">Importar modulo desde PDF</h2>
        <form onSubmit={importPdf} className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
          <input
            type="file"
            accept="application/pdf"
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
          />
          <button
            disabled={!pdfFile || busy}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold disabled:opacity-50"
          >
            {busy ? 'Importando...' : 'Importar'}
          </button>
        </form>
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">El modulo se crea como NO publicado para que lo revises.</p>
      </Card>

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[#173f74] dark:text-brand-300">Modulos existentes</h3>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
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
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                value={selected.title}
                onChange={(e) => setSelected((s) => ({ ...s, title: e.target.value }))}
                spellCheck
                autoCorrect="on"
                autoCapitalize="sentences"
              />
              <select
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                value={selected.level}
                onChange={(e) => setSelected((s) => ({ ...s, level: e.target.value }))}
              >
                <option>Básico</option>
                <option>Intermedio</option>
                <option>Avanzado</option>
              </select>
              <textarea
                className="md:col-span-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                value={selected.description}
                onChange={(e) => setSelected((s) => ({ ...s, description: e.target.value }))}
                spellCheck
                autoCorrect="on"
                autoCapitalize="sentences"
              />
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
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
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  Guardar
                </button>
                <button
                  onClick={() => removeModule(selected._id)}
                  disabled={busy}
                  className="rounded-lg bg-red-100 px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-50 dark:bg-red-500/20 dark:text-red-200"
                >
                  Eliminar
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white/70 p-4 text-slate-800 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-100">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-bold uppercase tracking-widest text-[#173f74] dark:text-brand-300">Niveles</h4>
                <div className="text-xs text-slate-600 dark:text-slate-400">Total: {levels.length}</div>
              </div>

              <div className="space-y-3">
                {levels.map((lvl) => (
                  <div key={lvl._id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{lvl.order}. {lvl.title}</div>
                      <div className="truncate text-xs text-slate-600 dark:text-slate-400">{(lvl.contentText || '').slice(0, 80)}</div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => startEditLevel(lvl)}
                        className="rounded-lg bg-brand-500/20 px-3 py-2 text-xs text-[#173f74] dark:text-brand-200"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => removeLevel(lvl._id)}
                        className="rounded-lg bg-red-100 px-3 py-2 text-xs text-red-700 dark:bg-red-500/20 dark:text-red-200"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-3">
                <h5 className="text-sm font-bold text-[#173f74] dark:text-slate-100">{editingLevelId ? 'Editar nivel' : 'Agregar nivel'}</h5>
                <input
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  placeholder="Titulo del nivel"
                  value={levelForm.title}
                  onChange={(e) => setLevelForm((f) => ({ ...f, title: e.target.value }))}
                  spellCheck
                  autoCorrect="on"
                  autoCapitalize="sentences"
                />
                <input
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  placeholder="Video URL (opcional)"
                  value={levelForm.videoUrl}
                  onChange={(e) => setLevelForm((f) => ({ ...f, videoUrl: e.target.value }))}
                />
                <textarea
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  placeholder="Contenido"
                  rows={6}
                  value={levelForm.contentText}
                  onChange={(e) => setLevelForm((f) => ({ ...f, contentText: e.target.value }))}
                  spellCheck
                  autoCorrect="on"
                  autoCapitalize="sentences"
                />
                <textarea
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  placeholder="Contexto para IA (opcional)"
                  rows={3}
                  value={levelForm.contextForAI}
                  onChange={(e) => setLevelForm((f) => ({ ...f, contextForAI: e.target.value }))}
                  spellCheck
                  autoCorrect="on"
                  autoCapitalize="sentences"
                />
                <div className="flex gap-2">
                  {editingLevelId ? (
                    <>
                      <button
                        onClick={saveLevel}
                        disabled={busy}
                        className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                      >
                        Guardar nivel
                      </button>
                      <button
                        onClick={() => {
                          setEditingLevelId('');
                          setLevelForm({ title: '', contentText: '', videoUrl: '', contextForAI: '' });
                        }}
                        className="rounded-lg bg-slate-200 px-4 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={addLevel}
                      disabled={busy}
                      className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
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
    </div>
  );
}
