import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { modulesApi } from '../../api/modules.api.js';
import { progressApi } from '../../api/progress.api.js';
import ModuleStudentPreview from '../../components/modules/ModuleStudentPreview.jsx';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [moduleItem, setModuleItem] = useState(null);
  const [levels, setLevels] = useState([]);
  const [progressRow, setProgressRow] = useState(null);
  const [lockedBySequence, setLockedBySequence] = useState(false);
  const [lockReason, setLockReason] = useState('');

  useEffect(() => {
    const load = async () => {
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
    window.dispatchEvent(new CustomEvent('tuvir:chat:send', { detail: { message, context } }));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{moduleItem?.title}</h2>
      <p className="text-sm text-slate-400">{moduleItem?.description}</p>
      {lockedBySequence ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-800">
          <p className="text-sm font-semibold">Modulo bloqueado</p>
          <p className="mt-1 text-sm">{lockReason}</p>
        </div>
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
  );
}
