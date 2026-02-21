import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { modulesApi } from '../../api/modules.api.js';
import { progressApi } from '../../api/progress.api.js';
import ModuleStudentPreview from '../../components/modules/ModuleStudentPreview.jsx';
import Card from '../../components/common/Card.jsx';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [moduleItem, setModuleItem] = useState(null);
  const [levels, setLevels] = useState([]);
  const [progressRow, setProgressRow] = useState(null);
  const [lockedBySequence, setLockedBySequence] = useState(false);
  const [lockReason, setLockReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [moduleRes, progressRes, publishedRes] = await Promise.all([
          modulesApi.get(id),
          progressApi.myProgress(),
          modulesApi.listPublished()
        ]);

      const moduleData = moduleRes.data.module;
      const levelData = moduleRes.data.levels || [];
      const progressRows = progressRes.data.progress || [];
      const publishedModules = [...(publishedRes.data.modules || [])].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      setModuleItem(moduleData);
      setLevels(levelData);

      const row = progressRows.find((item) => String(item.moduleId) === String(id)) || null;
      setProgressRow(row);

      const currentIndex = publishedModules.findIndex((item) => String(item._id) === String(id));
      if (currentIndex > 0) {
        const prevModule = publishedModules[currentIndex - 1];
        const prevProgress = progressRows.find((item) => String(item.moduleId) === String(prevModule._id));
        const prevCompleted = Number(prevProgress?.moduleProgressPercent || 0) >= 100 || Boolean(prevProgress?.completedAt);

        if (!prevCompleted) {
          setLockedBySequence(true);
          setLockReason(`Debes completar primero el modulo anterior: ${prevModule.title}.`);
          return;
        }
      }

        setLockedBySequence(false);
        setLockReason('');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const complete = async (level) => {
    const res = await progressApi.completeLevel({ moduleId: id, levelOrder: level.order });
    setProgressRow(res.data.progress);
  };

  const finishModule = () => {
    navigate('/student/courses');
  };

  const askHelp = (level) => {
    const context = `Modulo: ${moduleItem?.title}\nNivel: ${level.title}\nContexto: ${level.contextForAI}`;
    const message = `Estoy en el nivel ${level.title}. Explicame paso a paso y guiame sin darme la respuesta.`;
    window.dispatchEvent(new CustomEvent('tuvir:chat:send', {
      detail: { message, context, moduleId: id, levelId: level._id }
    }));
  };

  return (
    <Card className="rounded-3xl border-cyan-100/80 bg-gradient-to-br from-sky-50/85 via-cyan-50/65 to-slate-50 dark:border-slate-800 dark:bg-slate-900/40 dark:bg-none">
      <div className="space-y-4">
        <Card className="border-cyan-100/80 bg-white/90 p-5 dark:border-slate-700 dark:bg-slate-900/60">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{moduleItem?.title || 'Cargando modulo...'}</h2>
            <button
              type="button"
              onClick={() => navigate('/student/courses')}
              className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <ChevronLeft className="h-4 w-4" /> Volver a modulos
            </button>
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{moduleItem?.description || 'Estamos preparando el contenido del modulo.'}</p>
        </Card>

        {loading ? (
          <Card className="border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/60">
            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-transparent dark:border-slate-600" />
              Cargando contenido del modulo...
            </div>
          </Card>
        ) : lockedBySequence ? (
          <Card className="border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-200">
            <p className="text-sm font-semibold">Modulo bloqueado</p>
            <p className="mt-1 text-sm">{lockReason}</p>
          </Card>
        ) : (
          <ModuleStudentPreview
            role="student"
            levels={levels}
            moduleTitle={moduleItem?.title || ''}
            showActions
            onAskHelp={askHelp}
            onComplete={complete}
            onFinishModule={finishModule}
            completedLevelOrders={progressRow?.levelsCompleted || []}
            currentLevelOrder={progressRow?.currentLevelOrder || 1}
          />
        )}
      </div>
    </Card>
  );
}
