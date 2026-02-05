import { News } from '../models/News.model.js';

const categories = ['Innovación', 'Mecatrónica', 'Robótica', 'Humanoides'];

export async function ensureDailyNews() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const count = await News.countDocuments({ date: { $gte: start } });
  if (count > 0) return;

  const batch = categories.map((category, i) => ({
    title: `${category}: tendencia destacada del día`,
    summary:
      'Resumen generado automáticamente. Integra un servicio IA en news.service.js para contenido real.',
    category,
    source: 'AI',
    date: start,
    createdByAI: true,
    createdAt: new Date(start.getTime() + i * 1000)
  }));

  await News.insertMany(batch);
}
