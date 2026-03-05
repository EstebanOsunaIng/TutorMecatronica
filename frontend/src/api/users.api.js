import axiosClient from './axiosClient.js';

export const usersApi = {
  list: (q) => axiosClient.get('/users', { params: { q } }),
  create: (payload) => axiosClient.post('/users', payload),
  update: (id, payload) => axiosClient.put(`/users/${id}`, payload),
  remove: (id) => axiosClient.delete(`/users/${id}`),
  me: () => axiosClient.get('/users/me'),
  updateMe: (payload) => axiosClient.put('/users/me', payload)
};
