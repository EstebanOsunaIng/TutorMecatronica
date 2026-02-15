import { chatWithTutor } from '../services/ai.service.js';
import { ChatSession } from '../models/ChatSession.model.js';

function buildSessionTitle(message) {
  const text = String(message || '').trim();
  if (!text) return 'Nueva conversacion';
  return text.length > 80 ? `${text.slice(0, 77)}...` : text;
}

export async function chat(req, res) {
  const { message, context, sessionId } = req.body;
  if (!message) return res.status(400).json({ error: 'Missing message' });

  const userId = req.user.id;

  let session = null;
  if (sessionId) {
    session = await ChatSession.findOne({ _id: sessionId, userId });
  }

  if (!session) {
    session = await ChatSession.create({
      userId,
      title: buildSessionTitle(message),
      messages: []
    });
  }

  session.messages.push({ role: 'user', text: String(message).trim() });

  const result = await chatWithTutor({ message, context });
  const assistantText = result?.text || 'No pude generar respuesta en este momento.';
  session.messages.push({ role: 'assistant', text: assistantText });
  session.updatedAt = new Date();
  await session.save();

  res.json({ text: assistantText, sessionId: session._id });
}

export async function listHistory(req, res) {
  const sessions = await ChatSession.find({ userId: req.user.id })
    .sort({ updatedAt: -1 })
    .select('_id title updatedAt createdAt');
  res.json({ sessions });
}

export async function getHistoryById(req, res) {
  const session = await ChatSession.findOne({ _id: req.params.id, userId: req.user.id });
  if (!session) return res.status(404).json({ error: 'Conversation not found' });
  res.json({ session });
}
