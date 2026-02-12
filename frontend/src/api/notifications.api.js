import axiosClient from './axiosClient.js';

export const notificationsApi = {
  list: () => axiosClient.get('/notificaciones'),
  markRead: (id) => axiosClient.patch(`/notificaciones/${id}/leida`),
  markAllRead: () => axiosClient.patch('/notificaciones/leidas')
};
