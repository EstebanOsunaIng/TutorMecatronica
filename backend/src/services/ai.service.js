export async function chatWithTutor({ message, context }) {
  const prompt = `${context || ''}\n\n${message}`.trim();
  return {
    text:
      'Modo sin IA: integra tu proveedor en ai.service.js.\n\n' +
      `Prompt recibido:\n${prompt}`
  };
}
