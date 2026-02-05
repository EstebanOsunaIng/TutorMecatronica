import { chatWithTutor } from '../services/ai.service.js';

export async function chat(req, res) {
  const { message, context } = req.body;
  if (!message) return res.status(400).json({ error: 'Missing message' });
  const result = await chatWithTutor({ message, context });
  res.json(result);
}
