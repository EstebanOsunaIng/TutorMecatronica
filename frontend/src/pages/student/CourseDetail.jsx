import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Card from '../../components/common/Card.jsx';
import Modal from '../../components/common/Modal.jsx';
import { modulesApi } from '../../api/modules.api.js';
import { progressApi } from '../../api/progress.api.js';
import { aiApi } from '../../api/ai.api.js';

export default function CourseDetail() {
  const { id } = useParams();
  const [moduleItem, setModuleItem] = useState(null);
  const [levels, setLevels] = useState([]);
  const [help, setHelp] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    modulesApi.get(id).then((res) => {
      setModuleItem(res.data.module);
      setLevels(res.data.levels || []);
    });
  }, [id]);

  const complete = async (level) => {
    await progressApi.completeLevel({ moduleId: id, levelOrder: level.order });
  };

  const askHelp = async (level) => {
    const context = `Modulo: ${moduleItem?.title}\nNivel: ${level.title}\nContexto: ${level.contextForAI}`;
    const message = `Estoy en el nivel ${level.title}. Explicame paso a paso y guiame sin darme la respuesta.`;
    const { data } = await aiApi.chat({ message, context });
    setHelp(data.text);
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{moduleItem?.title}</h2>
      <p className="text-sm text-slate-400">{moduleItem?.description}</p>
      <div className="grid gap-4">
        {levels.map((level) => (
          <Card key={level._id}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{level.order}. {level.title}</h3>
                <p className="text-sm text-slate-400">{level.contentText?.slice(0, 120)}...</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => askHelp(level)}
                  className="rounded-lg bg-brand-500/20 px-3 py-2 text-xs text-brand-200"
                >
                  Pedir ayuda
                </button>
                <button
                  onClick={() => complete(level)}
                  className="rounded-lg bg-emerald-500/20 px-3 py-2 text-xs text-emerald-200"
                >
                  Completar
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Modal open={open} onClose={() => setOpen(false)}>
        <h3 className="mb-3 text-lg font-bold">Ayuda del tutor</h3>
        <p className="text-sm text-slate-300 whitespace-pre-wrap">{help}</p>
      </Modal>
    </div>
  );
}
