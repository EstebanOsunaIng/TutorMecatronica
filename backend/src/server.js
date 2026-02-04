import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const PORT = Number(process.env.PORT || 3001);

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/tutor', async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Missing OPENAI_API_KEY in backend environment' });
    }

    const { prompt, history = [] } = req.body || {};
    if (typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'prompt must be a non-empty string' });
    }
    if (!Array.isArray(history)) {
      return res.status(400).json({ error: 'history must be an array' });
    }

    const client = new OpenAI({ apiKey });

    const system =
      "Eres 'TuVir', un tutor experto en Mecatrónica de la Universitaria de Colombia. Tu objetivo es ayudar a los estudiantes con conceptos de robótica, electrónica, programación (C++, Python), y diseño mecánico. Eres amable, técnico pero claro, y fomentas el pensamiento crítico. Si el estudiante te hace una pregunta fuera de mecatrónica, redirígelo gentilmente a temas de ingeniería.";

    const input = [
      { role: 'system', content: system },
      ...history.map((h) => ({
        role: h?.role === 'model' ? 'assistant' : 'user',
        content: String(h?.parts?.[0]?.text ?? '')
      })),
      { role: 'user', content: prompt }
    ];

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      input,
      temperature: 0.7
    });

    res.json({ text: response.output_text || '' });
  } catch (err) {
    console.error('POST /api/tutor error:', err);
    res.status(500).json({ error: 'Tutor service failed' });
  }
});

app.listen(PORT, () => {
  console.log(`[backend] listening on http://localhost:${PORT}`);
});
