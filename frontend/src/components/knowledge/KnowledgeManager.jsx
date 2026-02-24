import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Trash2, Upload } from 'lucide-react';
import Card from '../common/Card.jsx';
import RobotLoader from '../common/RobotLoader.jsx';
import { knowledgeApi } from '../../api/knowledge.api.js';
import { modulesApi } from '../../api/modules.api.js';

function fixMojibake(value) {
  const input = String(value || '');
  if (!input) return input;
  if (!/[ÃÂ]/.test(input)) return input;
  try {
    const bytes = Uint8Array.from(input.split('').map((ch) => ch.charCodeAt(0)));
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  } catch {
    return input;
  }
}

export default function KnowledgeManager() {
  const MAX_PDF_BYTES = 50 * 1024 * 1024;
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [modules, setModules] = useState([]);
  const [levels, setLevels] = useState([]);
  const [levelsLoading, setLevelsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [busyDeleteId, setBusyDeleteId] = useState('');
  const [fileError, setFileError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitInfo, setSubmitInfo] = useState('');

  const [form, setForm] = useState({
    title: '',
    moduleId: '',
    levelId: ''
  });
  const [file, setFile] = useState(null);

  const loadDocuments = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const res = await knowledgeApi.list();
      setDocuments(res.data.documents || []);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadModules = async () => {
    const res = await modulesApi.list();
    const list = Array.isArray(res.data.modules) ? res.data.modules : [];
    setModules(list);
  };

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      try {
        await Promise.all([loadDocuments({ silent: true }), loadModules()]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadLevels = async () => {
      if (!form.moduleId) {
        setLevels([]);
        setForm((prev) => ({ ...prev, levelId: '' }));
        return;
      }
      setLevelsLoading(true);
      try {
        const res = await modulesApi.get(form.moduleId);
        if (!active) return;
        const list = Array.isArray(res.data.levels) ? res.data.levels : [];
        setLevels(
          [...list].sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
        );
      } catch {
        if (active) setLevels([]);
      } finally {
        if (active) setLevelsLoading(false);
      }
    };
    loadLevels();
    return () => {
      active = false;
    };
  }, [form.moduleId]);

  const readyCount = useMemo(() => documents.filter((d) => d.status === 'ready').length, [documents]);

  const submit = async (e) => {
    e.preventDefault();
    if (!file || uploading) return;
    setSubmitError('');
    setSubmitInfo('');
    setUploadPercent(0);
    if (file.size > MAX_PDF_BYTES) {
      setFileError('El archivo supera el maximo de 50MB');
      return;
    }
    setUploading(true);
    try {
      await knowledgeApi.upload({
        file,
        title: form.title,
        moduleId: form.moduleId || undefined,
        levelId: form.levelId || undefined,
        onUploadProgress: (evt) => {
          const total = evt?.total || 0;
          const loaded = evt?.loaded || 0;
          if (!total) return;
          const pct = Math.max(0, Math.min(100, Math.round((loaded / total) * 100)));
          setUploadPercent(pct);
        }
      });
      setFile(null);
      setForm({ title: '', moduleId: '', levelId: '' });
      setSubmitInfo('Documento recibido. Procesando...');
      await loadDocuments();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Error subiendo documento';
      setSubmitError(msg);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (!documents.some((d) => d.status === 'processing')) return;
    const id = setInterval(() => {
      loadDocuments({ silent: true });
    }, 3500);
    return () => clearInterval(id);
  }, [documents]);

  const renderBar = (percent, tone = 'brand') => {
    const pct = Number.isFinite(Number(percent)) ? Math.max(0, Math.min(100, Number(percent))) : 0;
    const barClass =
      tone === 'error'
        ? 'bg-red-500'
        : tone === 'ok'
          ? 'bg-emerald-500'
          : 'bg-brand-500';

    return (
      <div className="flex w-32 items-center gap-2">
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className={`h-full ${barClass}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-300">{pct}%</div>
      </div>
    );
  };

  const removeDoc = async (id) => {
    if (!id || busyDeleteId) return;
    if (!confirm('Eliminar este documento de la base de conocimiento?')) return;
    setBusyDeleteId(id);
    try {
      await knowledgeApi.remove(id);
      await loadDocuments();
    } finally {
      setBusyDeleteId('');
    }
  };

  return (
    <div className="space-y-4">
      {loading && <RobotLoader label="Cargando base de conocimiento..." scale={0.9} overlay />}
      <Card className="rounded-3xl border-cyan-100/80 bg-gradient-to-br from-sky-50/85 via-cyan-50/65 to-slate-50 dark:border-slate-800 dark:bg-slate-900/40 dark:bg-none">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[1.875rem] font-bold tracking-tight text-slate-900 dark:text-white">Base de conocimiento IA</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
              Sube PDFs para que TuVir use la documentacion al guiar al estudiante.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/85 px-3 py-1.5 font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200">
              Total documentos
              <strong className="text-slate-900 dark:text-white">{documents.length}</strong>
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
              Listos
              <strong>{readyCount}</strong>
            </span>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-[1.3rem] font-bold tracking-tight text-slate-900 dark:text-white">Subir PDF</h3>
        <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            placeholder="Titulo del documento (opcional)"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-900/40"
          />

          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              const next = e.target.files?.[0] || null;
              if (!next) {
                setFile(null);
                setFileError('');
                setSubmitError('');
                setSubmitInfo('');
                return;
              }
              if (next.size > MAX_PDF_BYTES) {
                setFile(null);
                setFileError('El archivo supera el maximo de 50MB');
                setSubmitError('');
                setSubmitInfo('');
                e.currentTarget.value = '';
                return;
              }
              setFile(next);
              setFileError('');
              setSubmitError('');
              setSubmitInfo('');
            }}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-100 file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-sky-800 hover:file:bg-sky-200 focus:border-sky-300 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:file:bg-slate-800 dark:file:text-sky-200 dark:hover:file:bg-slate-700"
          />

          {fileError && (
            <div className="md:col-span-2 text-xs font-semibold text-red-600 dark:text-red-300">{fileError}</div>
          )}

          {submitError && (
            <div className="md:col-span-2 text-xs font-semibold text-red-600 dark:text-red-300">{submitError}</div>
          )}

          {submitInfo && !submitError && !fileError && (
            <div className="md:col-span-2 text-xs font-semibold text-emerald-700 dark:text-emerald-200">{submitInfo}</div>
          )}

          {uploading && (
            <div className="md:col-span-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-300">
                <span>Subiendo archivo</span>
                <span>{uploadPercent}%</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div className="h-full bg-brand-500" style={{ width: `${uploadPercent}%` }} />
              </div>
            </div>
          )}

          <select
            value={form.moduleId}
            onChange={(e) => setForm((f) => ({ ...f, moduleId: e.target.value, levelId: '' }))}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-100"
          >
            <option value="">Sin modulo asociado (global)</option>
            {modules.map((m) => (
              <option key={m._id} value={m._id}>{fixMojibake(m.title)}</option>
            ))}
          </select>

          <select
            value={form.levelId}
            onChange={(e) => setForm((f) => ({ ...f, levelId: e.target.value }))}
            disabled={!form.moduleId || levelsLoading}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-500/10 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-100"
          >
            <option value="">{levelsLoading ? 'Cargando niveles...' : 'Sin nivel asociado'}</option>
            {levels.map((l) => (
              <option key={l._id} value={l._id}>{l.order}. {fixMojibake(l.title)}</option>
            ))}
          </select>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={!file || uploading || Boolean(fileError)}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? 'Subiendo...' : 'Subir a conocimiento'}
            </button>
          </div>
        </form>
      </Card>

      <Card>
        <h3 className="text-[1.3rem] font-bold tracking-tight text-slate-900 dark:text-white">Documentos</h3>

        {loading ? (
          <div className="mt-4 text-sm text-slate-500 dark:text-slate-300">Cargando documentos...</div>
        ) : documents.length === 0 ? (
          <div className="mt-4 text-sm text-slate-500 dark:text-slate-300">No hay documentos en la base de conocimiento.</div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <tr>
                  <th className="py-3 pr-6">Documento</th>
                  <th className="py-3 pr-6">Modulo/Nivel</th>
                  <th className="py-3 pr-6">Estado</th>
                  <th className="py-3 pr-6">Progreso</th>
                  <th className="py-3 pr-6 text-center">Chunks</th>
                  <th className="py-3 pr-6 text-center">Actualizado</th>
                  <th className="py-3 text-center">Accion</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((d) => (
                  <tr key={d._id} className="border-t border-slate-200 dark:border-slate-800">
                    <td className="py-4 pr-6 align-top">
                      <div className="font-semibold">{fixMojibake(d.title)}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{fixMojibake(d.fileName || '-')}</div>
                    </td>
                    <td className="py-4 pr-6 align-top">
                      <div>{fixMojibake(d.moduleId?.title || 'Global')}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{fixMojibake(d.levelId?.title || '-')}</div>
                    </td>
                    <td className="py-4 pr-6 align-top">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-bold ${
                          d.status === 'ready'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
                            : d.status === 'error'
                              ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="py-4 pr-6 align-top">
                      {d.status === 'ready'
                        ? renderBar(100, 'ok')
                        : d.status === 'error'
                          ? renderBar(d.progressPercent ?? 0, 'error')
                          : renderBar(d.progressPercent ?? 0, 'brand')}
                    </td>
                    <td className="py-4 pr-6 text-center align-top">{d.chunksCount || 0}</td>
                    <td className="py-4 pr-6 text-center align-top">{new Date(d.updatedAt).toLocaleDateString()}</td>
                    <td className="py-4 text-center align-top">
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => removeDoc(d._id)}
                          disabled={busyDeleteId === d._id}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-500/30 dark:text-red-200 dark:hover:bg-red-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
