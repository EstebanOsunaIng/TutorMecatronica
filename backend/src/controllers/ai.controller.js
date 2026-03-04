import { chatWithTutorWithHistory, summarizeConversation, generateConversationTitle } from '../services/ai.service.js';
import { ChatSession } from '../models/ChatSession.model.js';
import { retrieveKnowledgeContext } from '../services/knowledge.service.js';
import { retrieveModuleContext } from '../services/moduleContext.service.js';
import fs from 'node:fs/promises';
import { assertImageFile } from '../utils/fileValidation.js';

function buildSessionTitle(message) {
  const text = String(message || '').trim();
  if (!text) return 'Nueva conversacion';
  return text.length > 80 ? `${text.slice(0, 77)}...` : text;
}

function isUserConfirmation(text) {
  const t = String(text || '').trim().toLowerCase();
  if (!t) return false;
  if (/^(ok|okay|listo|hecho|ya|si|sí|dale|continua|continuar|siguiente|perfecto|bien)$/.test(t)) return true;
  if (/(listo|hecho|ya|funcion(o|ó)|sirvi(o|ó)|lo (logre|logré)|termin(e|é))/i.test(t)) return true;
  return false;
}

function enforceGuidedResponse(text) {
  const raw = String(text || '').trim();
  if (!raw) return raw;

  const normalized = raw.replace(/\r/g, '');

  // If there is a numbered list, keep only the first item.
  const secondItem = normalized.search(/\n\s*(2\.|2\)|Paso\s*2\b)/i);
  let clipped = secondItem > 0 ? normalized.slice(0, secondItem).trim() : normalized;

  if (clipped.length > 700) clipped = `${clipped.slice(0, 680).trim()}...`;

  if (!/[?¿]\s*$/.test(clipped)) {
    clipped = `${clipped.replace(/\.*\s*$/, '').trim()}\n\n¿Te funciono este paso?`;
  }

  const lines = clipped.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length > 4) {
    const kept = lines.slice(0, 4);
    if (!/[?¿]\s*$/.test(kept[kept.length - 1])) kept[kept.length - 1] = '¿Te funciono este paso?';
    return kept.join('\n');
  }

  return clipped;
}

export async function chat(req, res) {
  const rawMessage = String(req.body.message || '').trim();
  const context = String(req.body.context || '').trim();
  const sessionId = req.body.sessionId;
  const moduleId = req.body.moduleId;
  const levelId = req.body.levelId;
  const uploadedImages = Array.isArray(req.files) ? req.files : [];
  const hasImages = uploadedImages.length > 0;

  if (!rawMessage && !hasImages) return res.status(400).json({ error: 'Missing message or image' });

  const message = rawMessage || 'Analiza estas imagenes y guiame paso a paso.';

  const userId = req.user.id;

  let session = null;
  let isNewSession = false;
  if (sessionId) {
    session = await ChatSession.findOne({ _id: sessionId, userId });
  }

  if (!session) {
    isNewSession = true;
    session = await ChatSession.create({
      userId,
      title: buildSessionTitle(message),
      summary: '',
      teachingMode: 'guided',
      awaitingConfirmation: false,
      messages: []
    });
  }

  session.messages.push({ role: 'user', text: String(message).trim() });

  const userConfirmed = isUserConfirmation(message);
  const teachingMode = session.teachingMode || 'guided';
  const awaitingConfirmation = Boolean(session.awaitingConfirmation);
  if (teachingMode === 'guided' && awaitingConfirmation && userConfirmed) session.awaitingConfirmation = false;

  // If the conversation gets long, create/update a summary and keep full history stored.
  // The AI will receive: summary + full messages (best-effort, limited by provider).
  const approxChars = session.messages.reduce((acc, m) => acc + (m?.text ? String(m.text).length : 0), 0);
  const shouldSummarize = session.messages.length >= 40 || approxChars >= 18000;
  if (shouldSummarize) {
    const newSummary = await summarizeConversation({ messages: session.messages, previousSummary: session.summary || '' });
    if (newSummary) session.summary = newSummary;
  }

  let ragContext = '';
  try {
    const rag = await retrieveKnowledgeContext({ query: message, moduleId, levelId });
    ragContext = rag?.contextText || '';
  } catch {
    ragContext = '';
  }

  let moduleContext = '';
  try {
    moduleContext = await retrieveModuleContext({
      user: { id: req.user.id, role: req.user.role },
      query: message,
      moduleId,
      levelId
    });
  } catch {
    moduleContext = '';
  }

  const pacingContext =
    teachingMode === 'guided'
      ? Boolean(session.awaitingConfirmation) && !userConfirmed
        ? 'Ritmo: El estudiante NO ha confirmado el paso anterior. No avances a un paso nuevo. Responde con una aclaracion o pide confirmacion para continuar.'
        : 'Ritmo: Da SOLO el siguiente paso y pide confirmacion.'
      : '';

  const mergedContext = [
    context || '',
    pacingContext,
    moduleContext ? `Contenido del modulo:\n${moduleContext}` : '',
    ragContext ? `Documentacion relevante:\n${ragContext}` : ''
  ]
    .filter(Boolean)
    .join('\n\n');

  const imageDataUrls = [];
  const imagePaths = [];
  try {
    if (hasImages) {
      for (const file of uploadedImages) {
        if (!file?.path) continue;
        imagePaths.push(file.path);
        await assertImageFile(file.path);
        const bytes = await fs.readFile(file.path);
        const mime = file.mimetype || 'image/jpeg';
        imageDataUrls.push(`data:${mime};base64,${bytes.toString('base64')}`);
      }
    }

    const historyForModel = session.messages.slice(0, -1);
    const result = await chatWithTutorWithHistory({
      messages: historyForModel,
      message,
      context: mergedContext,
      summary: session.summary || '',
      imageDataUrls,
      hasImage: hasImages
    });

    const assistantRaw = result?.text || 'No pude generar respuesta en este momento.';
    const assistantText = teachingMode === 'guided' ? enforceGuidedResponse(assistantRaw) : assistantRaw;

    if (isNewSession) {
      const smartTitle = await generateConversationTitle({
        firstUserMessage: message,
        firstAssistantMessage: assistantText,
        context: mergedContext
      });
      if (smartTitle) session.title = smartTitle;
    }

    session.messages.push({ role: 'assistant', text: assistantText });
    if (teachingMode === 'guided') session.awaitingConfirmation = true;
    session.updatedAt = new Date();
    await session.save();

    // Keep only the 10 most recently used conversations.
    const oldSessions = await ChatSession.find({ userId })
      .sort({ updatedAt: -1 })
      .skip(10)
      .select('_id');
    if (oldSessions.length > 0) {
      await ChatSession.deleteMany({ _id: { $in: oldSessions.map((s) => s._id) }, userId });
    }

    return res.json({ text: assistantText, sessionId: session._id });
  } finally {
    for (const imagePath of imagePaths) {
      await fs.rm(imagePath, { force: true }).catch(() => {});
    }
  }
}

export async function listHistory(req, res) {
  const sessions = await ChatSession.find({ userId: req.user.id })
    .sort({ updatedAt: -1 })
    .limit(10)
    .select('_id title updatedAt createdAt');
  res.json({ sessions });
}

export async function getHistoryById(req, res) {
  const session = await ChatSession.findOne({ _id: req.params.id, userId: req.user.id });
  if (!session) return res.status(404).json({ error: 'Conversation not found' });
  res.json({ session });
}

export async function deleteHistory(req, res) {
  const deleted = await ChatSession.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!deleted) return res.status(404).json({ error: 'Conversation not found' });
  res.json({ ok: true });
}
