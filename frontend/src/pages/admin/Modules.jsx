import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Modal from '../../components/common/Modal.jsx';
import { modulesApi } from '../../api/modules.api.js';
import ModuleStudentPreview from '../../components/modules/ModuleStudentPreview.jsx';
import RobotLoader from '../../components/common/RobotLoader.jsx';

const DEFAULT_MODULE_IMAGE = '/assets/campus-placeholder.svg';

export default function AdminModules() {
  const location = useLocation();
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [search, setSearch] = useState('');
  const [moduleToDelete, setModuleToDelete] = useState(null);
  const [previewState, setPreviewState] = useState({ open: false, moduleItem: null, levels: [], loading: false });
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await modulesApi.list();
      setModules(res.data.modules || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!location.state?.notice) return;
    setNotice(location.state.notice);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeoutId = setTimeout(() => setNotice(''), 7000);
    return () => clearTimeout(timeoutId);
  }, [notice]);

  const togglePublish = async (m) => {
    if (!m?._id) return;
    setBusyId(m._id);
    try {
      await modulesApi.update(m._id, { isPublished: !m.isPublished });
      await load();
    } finally {
      setBusyId('');
    }
  };

  const remove = async (moduleId) => {
    if (!moduleId) return;
    setBusyId(moduleId);
    try {
      await modulesApi.remove(moduleId);
      await load();
    } finally {
      setBusyId('');
    }
  };

  const orderedModules = useMemo(() => {
    return [...modules].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [modules]);

  const filteredModules = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orderedModules
      .map((m, index) => {
        return {
          ...m,
          moduleNumber: index + 1
        };
      })
      .filter((m) => !term || (m.title || '').toLowerCase().includes(term));
  }, [orderedModules, search]);

  const moduleImage = (moduleItem) => {
    return moduleItem.imageUrl || moduleItem.image || moduleItem.coverImage || DEFAULT_MODULE_IMAGE;
  };

  const openPreview = async (moduleItem) => {
    if (!moduleItem?._id) return;
    setPreviewState({ open: true, moduleItem, levels: [], loading: true });
    try {
      const res = await modulesApi.get(moduleItem._id);
      setPreviewState({
        open: true,
        moduleItem: res.data?.module || moduleItem,
        levels: Array.isArray(res.data?.levels) ? res.data.levels : [],
        loading: false
      });
    } catch {
      setPreviewState({ open: true, moduleItem, levels: [], loading: false });
    }
  };

  return (
    <div className="space-y-4">
      <Card className="rounded-3xl border-cyan-100/80 bg-gradient-to-br from-sky-50/85 via-cyan-50/65 to-slate-50 dark:border-slate-800 dark:bg-slate-900/40 dark:bg-none">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-[1.875rem] font-bold">Gestion de modulos</h2>
            <p className="mt-1 text-sm text-slate-400">Administra, edita y publica los modulos del sistema.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-3xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por titulo"
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
              />
            </div>
            <button
              onClick={() => navigate('/admin/modules/editor')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition hover:brightness-110"
            >
              <Plus className="h-4 w-4" />
              Crear Nuevo Modulo
            </button>
          </div>
        </div>

          {notice && (
            <p className="mt-4 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100">
              {notice}
            </p>
          )}
        </Card>

        <Card className="border-cyan-100/80 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-900/60">
          {loading ? (
            <RobotLoader label="Cargando modulos..." scale={0.9} overlay />
          ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredModules.map((m) => {
            return (
            <Card
              key={m._id}
              onClick={() => openPreview(m)}
              className="group overflow-hidden border border-cyan-100 bg-white/90 !p-0 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50"
            >
            <div className="flex h-full flex-col">
              <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-t-2xl bg-slate-800">
                <img
                  src={moduleImage(m)}
                  alt={m.title || 'Modulo'}
                  onError={(e) => {
                    if (e.currentTarget.src !== window.location.origin + DEFAULT_MODULE_IMAGE) {
                      e.currentTarget.src = DEFAULT_MODULE_IMAGE;
                    }
                  }}
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent dark:from-slate-950/55" />

                <div className="absolute left-3 top-3 flex items-center gap-2">
                  <span className="rounded-full bg-white/95 px-2 py-1 text-[11px] font-bold text-slate-800 ring-1 ring-slate-300 dark:bg-slate-900/75 dark:text-slate-100 dark:ring-white/20">
                    Modulo {m.moduleNumber}
                  </span>
                </div>

                <span
                  className={`absolute right-3 top-3 rounded-full px-2 py-1 text-[11px] font-semibold ${
                    m.isPublished
                      ? 'bg-emerald-100/95 text-emerald-800 ring-1 ring-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-100 dark:ring-emerald-300/35'
                      : 'bg-slate-100/95 text-slate-700 ring-1 ring-slate-300 dark:bg-slate-800/70 dark:text-slate-200 dark:ring-slate-300/20'
                  }`}
                >
                  {m.isPublished ? 'Publicado' : 'No publicado'}
                </span>

                <span className="absolute right-3 top-12 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-slate-700 ring-1 ring-slate-300 dark:bg-slate-900/70 dark:text-slate-200 dark:ring-white/15">
                  {m.category || 'General'}
                </span>

              </div>

              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="space-y-2">
                  <h3 className="line-clamp-2 text-base font-extrabold text-slate-900 group-hover:text-[#1d4f91] dark:text-white dark:group-hover:text-sky-200">
                    {m.title || 'Modulo sin titulo'}
                  </h3>

                  <p className="line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300" title={m.description || 'Sin descripcion.'}>
                    {m.description || 'Sin descripcion.'}
                  </p>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {m.moduleNumber > 1 ? (
                      <>
                        Se desbloquea al completar: <span className="font-semibold">Modulo {m.moduleNumber - 1}</span>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold">Modulo inicial</span> (sin requisito previo)
                      </>
                    )}
                  </p>
                </div>

                <div className="mt-auto grid grid-cols-3 gap-2 border-t border-cyan-100 pt-3 dark:border-white/10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/modules/editor?moduleId=${m._id}`);
                    }}
                    disabled={busyId === m._id}
                    className="inline-flex w-full items-center justify-center gap-1 whitespace-nowrap rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-brand-400 dark:hover:text-brand-100"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePublish(m);
                    }}
                    disabled={busyId === m._id}
                    className="w-full whitespace-nowrap rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-brand-400 dark:hover:text-brand-100"
                  >
                    {m.isPublished ? 'Ocultar' : 'Publicar'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setModuleToDelete(m);
                    }}
                    disabled={busyId === m._id}
                    className="inline-flex w-full items-center justify-center gap-1 whitespace-nowrap rounded-full border border-rose-200 bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 dark:border-rose-500/30 dark:bg-slate-900/60 dark:text-rose-200 dark:hover:border-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
            </Card>
            );
          })}

          {!filteredModules.length && (
            <Card className="bg-cyan-50/70 dark:bg-slate-900">
              <div className="text-sm text-slate-400">No hay modulos que coincidan con la busqueda.</div>
            </Card>
          )}
          </div>
          )}
        </Card>

      <Modal open={Boolean(moduleToDelete)} onClose={() => setModuleToDelete(null)}>
        <h3 className="text-lg font-bold">Confirmar eliminacion</h3>
        <p className="mt-2 text-sm text-slate-300">
          ¿Estás seguro de que deseas eliminar este módulo? Esta acción no se puede deshacer.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => setModuleToDelete(null)}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-100"
          >
            Cancelar
          </button>
          <button
            onClick={async () => {
              const moduleId = moduleToDelete?._id;
              setModuleToDelete(null);
              await remove(moduleId);
            }}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Eliminar modulo
          </button>
        </div>
      </Modal>

      {previewState.open && (
        <div className="fixed inset-0 z-[65] bg-black/70 p-3 md:p-6">
          <div className="mx-auto h-full w-full max-w-6xl overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Vista previa del estudiante</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{previewState.moduleItem?.title || 'Modulo'}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewState({ open: false, moduleItem: null, levels: [], loading: false })}
                className="rounded-full border border-sky-300 bg-sky-50 p-2 text-sky-800 transition hover:bg-sky-100 dark:border-sky-400/60 dark:bg-sky-500/25 dark:text-sky-100 dark:hover:bg-sky-500/35"
                title="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="h-[calc(100%-65px)] overflow-auto p-4">
              {previewState.loading ? (
                <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
                  <RobotLoader label="Cargando vista previa..." scale={0.75} />
                </div>
              ) : (
                <ModuleStudentPreview
                  role="admin"
                  levels={previewState.levels}
                  moduleTitle={previewState.moduleItem?.title || ''}
                  showActions={false}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
