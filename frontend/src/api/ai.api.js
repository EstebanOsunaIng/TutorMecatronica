import axiosClient from './axiosClient.js';

export const aiApi = {
  chat: (payload) => axiosClient.post('/ai/chat', payload)
};
