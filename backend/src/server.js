import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const PORT = Number(process.env.PORT || 3001);

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/tutor', async (req, res) => {
  try {
    const { prompt, history = [] } = req.body || {};
    if (typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'prompt must be a non-empty string' });
    }
    if (!Array.isArray(history)) {
      return res.status(400).json({ error: 'history must be an array' });
    }

    // Modo sin IA: dejamos una respuesta simple para mantener el flujo del frontend.
    const text =
      "Modo sin IA: aun no hay modelo conectado.\n\n" +
      `Tu pregunta: ${prompt.trim()}\n\n` +

      'Sugerencia: indica tema, nivel (basico/intermedio/avanzado) y si quieres ejemplo (Arduino/Python/C++).';

    res.json({ text });
  } catch (err) {
    console.error('POST /api/tutor error:', err);
    res.status(500).json({ error: 'Tutor service failed' });
  }
});

app.listen(PORT, () => {
  console.log(`[backend] listening on http://localhost:${PORT}`);
});
