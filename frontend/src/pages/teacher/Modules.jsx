import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Modal from '../../components/common/Modal.jsx';
import { modulesApi } from '../../api/modules.api.js';
import ModuleStudentPreview from '../../components/modules/ModuleStudentPreview.jsx';

const DEFAULT_MODULE_IMAGE = '/assets/campus-placeholder.svg';

export default function TeacherModules() {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [busyId, setBusyId] = useState('');
  const [search, setSearch] = useState('');
  const [moduleToDelete, setModuleToDelete] = useState(null);
  const [previewState, setPreviewState] = useState({ open: false, moduleItem: null, levels: [], loading: false });

  const load = async () => {
    const res = await modulesApi.list();
    setModules(res.data.modules || []);
  };

  useEffect(() => {
    load();
  }, []);

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
      .map((m, index) => ({ ...m, moduleNumber: index + 1 }))
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
      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold">Gestion de modulos</h2>
            <p className="mt-1 text-sm text-slate-400">Edita tus modulos y revisa como los vera el estudiante.</p>
          </div>
          <button
            onClick={() => navigate('/teacher/modules/editor')}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            Crear Nuevo Modulo
          </button>
        </div>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar modulo por nombre"
            className="w-full rounded-xl border border-slate-700 bg-slate-900/70 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand-400"
          />
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredModules.map((m) => (
          <Card
            key={m._id}
            onClick={() => openPreview(m)}
            className="group h-[440px] overflow-hidden border border-white/15 bg-white/[0.08] p-0 shadow-[0_18px_45px_-28px_rgba(8,47,73,0.95)] backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:bg-white/[0.12]"
          >
            <div className="flex h-full flex-col">
              <div className="relative h-44 w-full shrink-0 overflow-hidden bg-slate-800">
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
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/10 to-transparent" />

                <span className="absolute left-3 top-3 rounded-full bg-slate-900/75 px-2 py-1 text-[11px] font-bold text-slate-100 ring-1 ring-white/20">
                  Modulo {m.moduleNumber}
                </span>

                <span className="absolute right-3 top-3 rounded-full bg-slate-900/70 px-2 py-1 text-[10px] font-semibold text-slate-200 ring-1 ring-white/15">
                  {m.category || 'General'}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="space-y-2.5">
                  <h3 className="line-clamp-2 text-xl font-bold leading-tight text-white">{m.title || 'Modulo sin titulo'}</h3>
                  <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-300" title={m.description || 'Sin descripcion.'}>
                    {m.description || 'Sin descripcion.'}
                  </p>
                  <p className="text-[11px] text-cyan-100/80">
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

                <div className="mt-auto grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/teacher/modules/editor?moduleId=${m._id}`);
                    }}
                    disabled={busyId === m._id}
                    className="inline-flex h-8 w-full items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-brand-500/15 px-2 py-1.5 text-[10px] font-semibold text-brand-100 ring-1 ring-brand-300/30 transition hover:bg-brand-500/25 disabled:opacity-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setModuleToDelete(m);
                    }}
                    disabled={busyId === m._id}
                    className="inline-flex h-8 w-full items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-red-500/15 px-2 py-1.5 text-[10px] font-semibold text-red-200 ring-1 ring-red-400/25 transition hover:bg-red-500/25 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {!filteredModules.length && (
          <Card>
            <div className="text-sm text-slate-400">No hay modulos que coincidan con la busqueda.</div>
          </Card>
        )}
      </div>

      <Modal open={Boolean(moduleToDelete)} onClose={() => setModuleToDelete(null)}>
        <h3 className="text-lg font-bold">Confirmar eliminacion</h3>
        <p className="mt-2 text-sm text-slate-300">¿Seguro que deseas eliminar este modulo? Esta accion no se puede deshacer.</p>
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
          <div className="mx-auto h-full w-full max-w-6xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <div>
                <h3 className="text-lg font-bold text-white">Vista previa del estudiante</h3>
                <p className="text-xs text-slate-400">{previewState.moduleItem?.title || 'Modulo'}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewState({ open: false, moduleItem: null, levels: [], loading: false })}
                className="rounded-full bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white"
                title="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="h-[calc(100%-65px)] overflow-auto p-4">
              {previewState.loading ? (
                <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 text-sm text-slate-300">Cargando vista previa...</div>
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
