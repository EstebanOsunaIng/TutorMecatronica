import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Code2, FlaskConical, Globe2, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import Card from '../../components/common/Card.jsx';
import Modal from '../../components/common/Modal.jsx';
import { modulesApi } from '../../api/modules.api.js';
import ModuleStudentPreview from '../../components/modules/ModuleStudentPreview.jsx';

const DEFAULT_MODULE_IMAGE = '/assets/campus-placeholder.svg';

export default function AdminModules() {
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

  const filteredModules = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return modules;
    return modules.filter((m) => (m.title || '').toLowerCase().includes(term));
  }, [modules, search]);

  const moduleImage = (moduleItem) => {
    return moduleItem.imageUrl || moduleItem.image || moduleItem.coverImage || DEFAULT_MODULE_IMAGE;
  };

  const getDifficultyStyle = (level) => {
    const normalizedLevel = (level || '').toLowerCase();

    if (normalizedLevel.includes('bas')) {
      return { label: 'Basico', className: 'bg-emerald-500/80 text-emerald-50' };
    }

    if (normalizedLevel.includes('inter')) {
      return { label: 'Intermedio', className: 'bg-orange-500/80 text-orange-50' };
    }

    if (normalizedLevel.includes('avan')) {
      return { label: 'Avanzado', className: 'bg-rose-500/80 text-rose-50' };
    }

    return { label: level || 'Sin nivel', className: 'bg-slate-700/80 text-slate-100' };
  };

  const getCategoryMeta = (category) => {
    const normalizedCategory = (category || '').toLowerCase();

    if (normalizedCategory.includes('program') || normalizedCategory.includes('code')) {
      return { icon: Code2, label: category || 'Programacion' };
    }

    if (normalizedCategory.includes('ciencia') || normalizedCategory.includes('lab')) {
      return { icon: FlaskConical, label: category || 'Ciencia' };
    }

    if (normalizedCategory.includes('idioma') || normalizedCategory.includes('lengua')) {
      return { icon: Globe2, label: category || 'Idiomas' };
    }

    return { icon: BookOpen, label: category || 'General' };
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
            <p className="mt-1 text-sm text-slate-400">Administra, edita y publica los modulos del sistema.</p>
          </div>
          <button
            onClick={() => navigate('/admin/modules/editor')}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            + Crear Nuevo Modulo
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
        {filteredModules.map((m) => {
          const difficultyStyle = getDifficultyStyle(m.level);
          const categoryMeta = getCategoryMeta(m.category);

          return (
          <Card
            key={m._id}
            onClick={() => openPreview(m)}
            className="group overflow-hidden border border-white/15 bg-white/[0.08] p-0 shadow-[0_18px_45px_-28px_rgba(8,47,73,0.95)] backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:bg-white/[0.12]"
          >
            <div className="flex h-full flex-col">
              <div className="relative h-44 w-full overflow-hidden bg-slate-800">
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

                <div className="absolute left-3 top-3 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${difficultyStyle.className}`}>
                    {difficultyStyle.label}
                  </span>
                </div>

                <span
                  className={`absolute right-3 top-3 rounded-full px-2 py-1 text-[11px] font-semibold ${
                    m.isPublished ? 'bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-300/35' : 'bg-slate-800/70 text-slate-200 ring-1 ring-slate-300/20'
                  }`}
                >
                  {m.isPublished ? 'Publicado' : 'No publicado'}
                </span>

              </div>

              <div className="flex flex-1 flex-col gap-4 p-6">
                <div className="space-y-3">
                  <h3 className="text-xl font-bold leading-tight text-white">{m.title || 'Modulo sin titulo'}</h3>

                  <p className="text-sm leading-relaxed text-slate-300">{m.description || 'Sin descripcion.'}</p>

                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                    {React.createElement(categoryMeta.icon, { className: 'h-3.5 w-3.5 text-brand-200' })}
                    <span>{categoryMeta.label}</span>
                  </div>
                </div>

                <div className="mt-auto flex flex-wrap gap-2 border-t border-white/10 pt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/modules/editor?moduleId=${m._id}`);
                    }}
                    disabled={busyId === m._id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500/15 px-2.5 py-1.5 text-[11px] font-semibold text-brand-100 ring-1 ring-brand-300/30 transition hover:bg-brand-500/25 disabled:opacity-50"
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
                    className="rounded-lg bg-slate-700/55 px-2.5 py-1.5 text-[11px] font-semibold text-slate-100 ring-1 ring-white/15 transition hover:bg-slate-700 disabled:opacity-50"
                  >
                    {m.isPublished ? 'Ocultar' : 'Publicar'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setModuleToDelete(m);
                    }}
                    disabled={busyId === m._id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/15 px-2.5 py-1.5 text-[11px] font-semibold text-red-200 ring-1 ring-red-400/25 transition hover:bg-red-500/25 disabled:opacity-50"
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
          <Card>
            <div className="text-sm text-slate-400">No hay modulos que coincidan con la busqueda.</div>
          </Card>
        )}
      </div>

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
