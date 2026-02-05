import axiosClient from './axiosClient.js';

export const progressApi = {
  myProgress: () => axiosClient.get('/progress/me'),
  completeLevel: (payload) => axiosClient.post('/progress/complete-level', payload)
};
