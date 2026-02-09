import { env } from '../config/env.js';

async function openaiChat({ message, context }) {
  const apiKey = env.ai.openaiApiKey;
  if (!apiKey) return null;

  const system =
    'Eres TuVir, un tutor virtual de mecatronica. Tu objetivo es guiar paso a paso, '
    + 'hacer preguntas para diagnosticar, y NO dar la respuesta final directa. '
    + 'Si el usuario pide la respuesta, da pistas y una forma de verificarla. '
    + 'Responde en espanol claro y tecnico.';

  const userPrompt = `${context ? `${context}\n\n` : ''}${message}`.trim();

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: env.ai.openaiModel,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userPrompt }
      ],
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

function fallbackTutor({ message, context }) {
  const ctx = (context || '').trim();
  const msg = (message || '').trim();
  const header = 'Modo sin IA configurada (OPENAI_API_KEY no presente).\n';
  const guide =
    '\nGuia rapida:\n'
    + '1) Dime que parte exacta no entiendes (concepto, formula, diagrama, codigo o paso).\n'
    + '2) Que intentaste y que resultado obtuviste.\n'
    + '3) Yo te doy un plan paso a paso y una verificacion.';
  const echo = `\n\nContexto:\n${ctx || '(sin contexto)'}\n\nTu pregunta:\n${msg}`;
  return { text: header + guide + echo };
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
