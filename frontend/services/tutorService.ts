export type TutorHistoryItem = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

export async function getTutorResponse(prompt: string, history: TutorHistoryItem[] = []) {
  try {
    const res = await fetch('/api/tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, history })
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      throw new Error(payload?.error || `Tutor API error (${res.status})`);
    }

    const data = await res.json();
    return String(data?.text || '');
  } catch (error) {
    console.error('Tutor API Error:', error);
    return 'Lo siento, tuve un problema procesando tu consulta técnica. ¿Podrías intentar de nuevo?';
  }
}
