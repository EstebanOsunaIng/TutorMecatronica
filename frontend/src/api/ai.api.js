import axiosClient from './axiosClient.js';

export const aiApi = {
  chat: (payload) => axiosClient.post('/ai/chat', payload),
  history: () => axiosClient.get('/ai/history'),
  historyById: (id) => axiosClient.get(`/ai/history/${id}`)
};
