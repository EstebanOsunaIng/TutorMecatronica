import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Trash2, Upload } from 'lucide-react';
import Card from '../common/Card.jsx';
import { knowledgeApi } from '../../api/knowledge.api.js';
import { modulesApi } from '../../api/modules.api.js';

export default function KnowledgeManager({ roleLabel = 'Docente' }) {
  const MAX_PDF_BYTES = 50 * 1024 * 1024;
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [modules, setModules] = useState([]);
  const [levels, setLevels] = useState([]);
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
    setModules(res.data.modules || []);
  };

  useEffect(() => {
    loadDocuments();
    loadModules();
  }, []);

  useEffect(() => {
    const loadLevels = async () => {
      if (!form.moduleId) {
        setLevels([]);
        setForm((prev) => ({ ...prev, levelId: '' }));
        return;
      }
      const res = await modulesApi.get(form.moduleId);
      setLevels(res.data.levels || []);
    };
    loadLevels();
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
      <div className="w-28">
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className={`h-full ${barClass}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-300">{pct}%</div>
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
      <Card className="rounded-3xl border-cyan-100/80 bg-gradient-to-br from-sky-50/85 via-cyan-50/65 to-slate-50 dark:border-slate-800 dark:bg-slate-900/40 dark:bg-none">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">{roleLabel}</p>
            <h2 className="mt-1 text-2xl font-extrabold">Base de conocimiento IA</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
              Sube PDFs para que TuVir use la documentacion al guiar al estudiante.
            </p>
          </div>
          <div className="rounded-2xl border border-cyan-100 bg-white/80 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/50">
            <div>Total documentos: <strong>{documents.length}</strong></div>
            <div>Listos: <strong>{readyCount}</strong></div>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-bold uppercase tracking-widest text-brand-300">Subir PDF</h3>
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
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/40"
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
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-900/40"
          >
            <option value="">Sin modulo asociado (global)</option>
            {modules.map((m) => (
              <option key={m._id} value={m._id}>{m.title}</option>
            ))}
          </select>

          <select
            value={form.levelId}
            onChange={(e) => setForm((f) => ({ ...f, levelId: e.target.value }))}
            disabled={!form.moduleId}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900/40"
          >
            <option value="">Sin nivel asociado</option>
            {levels.map((l) => (
              <option key={l._id} value={l._id}>{l.order}. {l.title}</option>
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
        <h3 className="text-sm font-bold uppercase tracking-widest text-brand-300">Documentos</h3>

        {loading ? (
          <div className="mt-4 text-sm text-slate-500 dark:text-slate-300">Cargando documentos...</div>
        ) : documents.length === 0 ? (
          <div className="mt-4 text-sm text-slate-500 dark:text-slate-300">No hay documentos en la base de conocimiento.</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-2">Documento</th>
                  <th>Modulo/Nivel</th>
                  <th>Estado</th>
                  <th>Progreso</th>
                  <th>Chunks</th>
                  <th>Actualizado</th>
                  <th className="text-right">Accion</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((d) => (
                  <tr key={d._id} className="border-t border-slate-200 dark:border-slate-800">
                    <td className="py-2">
                      <div className="font-semibold">{d.title}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{d.fileName || '-'}</div>
                    </td>
                    <td>
                      <div>{d.moduleId?.title || 'Global'}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{d.levelId?.title || '-'}</div>
                    </td>
                    <td>
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
                    <td>
                      {d.status === 'ready'
                        ? renderBar(100, 'ok')
                        : d.status === 'error'
                          ? renderBar(d.progressPercent ?? 0, 'error')
                          : renderBar(d.progressPercent ?? 0, 'brand')}
                    </td>
                    <td>{d.chunksCount || 0}</td>
                    <td>{new Date(d.updatedAt).toLocaleDateString()}</td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => removeDoc(d._id)}
                        disabled={busyDeleteId === d._id}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-500/30 dark:text-red-200 dark:hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Eliminar
                      </button>
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
