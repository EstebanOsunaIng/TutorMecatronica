import { env } from '../config/env.js';

function toOpenAiRole(role) {
  return role === 'assistant' ? 'assistant' : 'user';
}

function normalizeTitle(value = '') {
  const cleaned = String(value || '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/["'`*#:_!?¿¡]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';
  return cleaned.length > 64 ? `${cleaned.slice(0, 61).trim()}...` : cleaned;
}

function fallbackConversationTitle(userText = '', assistantText = '') {
  const raw = `${userText} ${assistantText}`.toLowerCase();
  const stopWords = new Set([
    'que', 'como', 'para', 'con', 'sin', 'sobre', 'esta', 'este', 'estas', 'estos', 'aqui', 'hola', 'ayuda',
    'puedes', 'puedo', 'quiero', 'necesito', 'porque', 'donde', 'cuando', 'cual', 'tengo', 'tiene', 'usar', 'uso',
    'modulo', 'modulos', 'chat', 'tutor', 'imagen', 'imagenes'
  ]);

  const tokens = raw
    .split(/[^a-z0-9]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 4 && !stopWords.has(t));

  const unique = Array.from(new Set(tokens)).slice(0, 4);
  if (!unique.length) return 'Consulta academica';

  const title = unique
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return normalizeTitle(title) || 'Consulta academica';
}

function normalizeHistory(messages = []) {
  return (Array.isArray(messages) ? messages : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string')
    .map((m) => ({ role: toOpenAiRole(m.role), content: String(m.text).trim() }))
    .filter((m) => m.content);
}

async function openaiChat({ message, context, messages, summary, imageDataUrls = [] }) {
  const apiKey = env.ai.openaiApiKey;
  if (!apiKey) return null;

  const system =
    'Eres TuVir, un tutor virtual de mecatronica. Tu objetivo es guiar paso a paso, '
    + 'hacer preguntas para diagnosticar, y NO dar la respuesta final directa. '
    + 'Si el usuario pide la respuesta, da pistas y una forma de verificarla. '
    + 'Usa el contexto provisto (contenido del modulo y documentacion) cuando este disponible. '
    + 'Modo guiado: entrega SOLO 1 paso por mensaje, sin listas largas. '
    + 'Cierra SIEMPRE con una pregunta corta para confirmar si el estudiante pudo completar ese paso. '
    + 'No avances al siguiente paso hasta que el estudiante confirme (ej: "listo", "hecho", "ya"). '
    + 'Maximo 4 lineas por respuesta. '
    + 'Responde en espanol claro y tecnico.';

  const history = normalizeHistory(messages);
  const userPrompt = `${message || ''}`.trim();

  const systemContext = context ? `Contexto:\n${context}` : '';

  const validImageDataUrls = Array.isArray(imageDataUrls) ? imageDataUrls.filter(Boolean) : [];

  const userContent = validImageDataUrls.length
    ? [
      { type: 'text', text: userPrompt || 'Analiza estas imagenes y guiame paso a paso.' },
      ...validImageDataUrls.map((url) => ({ type: 'image_url', image_url: { url } }))
    ]
    : userPrompt;

  const msgList = [
    { role: 'system', content: system },
    ...(systemContext ? [{ role: 'system', content: systemContext }] : []),
    ...(summary ? [{ role: 'system', content: `Resumen de la conversacion hasta ahora:\n${summary}` }] : []),
    ...(history.length > 0 ? history : []),
    ...(userContent ? [{ role: 'user', content: userContent }] : [])
  ];

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: env.ai.openaiModel,
      messages: msgList,
      temperature: 0.4
    })
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw Object.assign(new Error('AI provider error'), { status: 502, code: 'AI_PROVIDER_ERROR', details: errText });
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) return { text: 'No pude generar una respuesta en este momento. Intenta de nuevo.' };
  return { text };
}

function fallbackTutor({ message, context, hasImage = false }) {
  const ctx = (context || '').trim();
  const msg = (message || '').trim();
  const header = 'Modo sin IA configurada (OPENAI_API_KEY no presente).\n';
  const imageNote = hasImage
    ? '\nNota: recibi tu imagen, pero no puedo analizarla sin configurar OPENAI_API_KEY.'
    : '';
  const guide =
    '\nGuia rapida:\n'
    + '1) Dime que parte exacta no entiendes (concepto, formula, diagrama, codigo o paso).\n'
    + '2) Que intentaste y que resultado obtuviste.\n'
    + '3) Yo te doy un plan paso a paso y una verificacion.';
  const echo = `\n\nContexto:\n${ctx || '(sin contexto)'}\n\nTu pregunta:\n${msg}`;
  return { text: header + imageNote + guide + echo };
}

export async function chatWithTutor({ message, context }) {
  try {
    const result = await openaiChat({ message, context });
    if (result) return result;
  } catch (err) {
    console.error('[ai] failed:', err);
  }
  return fallbackTutor({ message, context });
}

export async function chatWithTutorWithHistory({ messages, message = '', context, summary, imageDataUrls = [], hasImage = false }) {
  try {
    const result = await openaiChat({ messages, message, context, summary, imageDataUrls });
    if (result) return result;
  } catch (err) {
    console.error('[ai] failed:', err);
  }

  return fallbackTutor({ message: message || '', context, hasImage });
}

export async function summarizeConversation({ messages, previousSummary = '' }) {
  const apiKey = env.ai.openaiApiKey;
  if (!apiKey) return null;

  const history = normalizeHistory(messages);
  const text = history
    .map((m) => `${m.role === 'user' ? 'Usuario' : 'Tutor'}: ${m.content}`)
    .join('\n');

  const prompt =
    'Resume la conversacion de forma concisa (max 12 bullets). '
    + 'Incluye: objetivo del usuario, conceptos clave, avances, dudas abiertas, y proximos pasos. '
    + 'No inventes informacion.';

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: env.ai.openaiModel,
      messages: [
        { role: 'system', content: 'Eres un asistente que resume conversaciones.' },
        ...(previousSummary ? [{ role: 'user', content: `Resumen previo:\n${previousSummary}` }] : []),
        { role: 'user', content: `${prompt}\n\nConversacion:\n${text}` }
      ],
      temperature: 0.2
    })
  });

  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  const summary = data?.choices?.[0]?.message?.content;
  return summary ? String(summary).trim() : null;
}

export async function generateConversationTitle({ firstUserMessage = '', firstAssistantMessage = '', context = '' }) {
  const apiKey = env.ai.openaiApiKey;
  const fallback = fallbackConversationTitle(firstUserMessage, firstAssistantMessage);
  if (!apiKey) return fallback;

  const prompt =
    'Genera un titulo corto para una conversacion educativa. '
    + 'Debe tener entre 3 y 7 palabras, sonar profesional y describir el tema central. '
    + 'No uses signos de pregunta ni comillas. Solo devuelve el titulo.';

  const content = [
    context ? `Contexto:\n${String(context).slice(0, 1200)}` : '',
    `Mensaje del usuario:\n${String(firstUserMessage).slice(0, 600)}`,
    `Primera respuesta del tutor:\n${String(firstAssistantMessage).slice(0, 600)}`
  ].filter(Boolean).join('\n\n');

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: env.ai.openaiModel,
        messages: [
          { role: 'system', content: 'Eres un asistente que crea titulos breves.' },
          { role: 'user', content: `${prompt}\n\n${content}` }
        ],
        temperature: 0.2,
        max_tokens: 24
      })
    });

    if (!res.ok) return fallback;
    const data = await res.json().catch(() => null);
    const title = normalizeTitle(data?.choices?.[0]?.message?.content || '');
    return title || fallback;
  } catch {
    return fallback;
  }
}
