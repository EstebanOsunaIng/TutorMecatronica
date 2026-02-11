import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Card from '../../components/common/Card.jsx';
import { modulesApi } from '../../api/modules.api.js';
import { progressApi } from '../../api/progress.api.js';
import ModuleStudentPreview from '../../components/modules/ModuleStudentPreview.jsx';

export default function CourseDetail() {
  const { id } = useParams();
  const [moduleItem, setModuleItem] = useState(null);
  const [levels, setLevels] = useState([]);

  useEffect(() => {
    modulesApi.get(id).then((res) => {
      setModuleItem(res.data.module);
      setLevels(res.data.levels || []);
    });
  }, [id]);

  const complete = async (level) => {
    await progressApi.completeLevel({ moduleId: id, levelOrder: level.order });
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
      <Card>
        <ModuleStudentPreview
          levels={levels}
          moduleTitle={moduleItem?.title || ''}
          showActions
          onAskHelp={askHelp}
          onComplete={complete}
        />
      </Card>
    </div>
  );
}
