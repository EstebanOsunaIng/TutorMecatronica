import axiosClient from './axiosClient.js';

export const aiApi = {
  chat: (payload) => {
    if (payload?.imageFile instanceof File) {
      const form = new FormData();
      if (payload.message) form.append('message', payload.message);
      if (payload.context) form.append('context', payload.context);
      if (payload.sessionId) form.append('sessionId', payload.sessionId);
      if (payload.moduleId) form.append('moduleId', payload.moduleId);
      if (payload.levelId) form.append('levelId', payload.levelId);
      form.append('image', payload.imageFile);
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
