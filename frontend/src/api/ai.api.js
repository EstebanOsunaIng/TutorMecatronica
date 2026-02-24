import axiosClient from './axiosClient.js';

export const aiApi = {
  chat: (payload) => {
    const imageFiles = Array.isArray(payload?.imageFiles)
      ? payload.imageFiles.filter((f) => f instanceof File)
      : [];

    if (imageFiles.length > 0) {
      const form = new FormData();
      if (payload.message) form.append('message', payload.message);
      if (payload.context) form.append('context', payload.context);
      if (payload.sessionId) form.append('sessionId', payload.sessionId);
      if (payload.moduleId) form.append('moduleId', payload.moduleId);
      if (payload.levelId) form.append('levelId', payload.levelId);
      imageFiles.forEach((file) => form.append('images', file));
      return axiosClient.post('/ai/chat', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return axiosClient.post('/ai/chat', payload);
  },
  history: () => axiosClient.get('/ai/history'),
  historyById: (id) => axiosClient.get(`/ai/history/${id}`),
  deleteHistory: (id) => axiosClient.delete(`/ai/history/${id}`)
};
