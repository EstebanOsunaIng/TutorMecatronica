import axiosClient from './axiosClient.js';

export const notificationsApi = {
  list: (params) => axiosClient.get('/notificaciones', { params }),
  markRead: (id) => axiosClient.patch(`/notificaciones/${id}/leida`),
  markAllRead: (params) => axiosClient.patch('/notificaciones/marcar-todas', {}, { params }),
  removeMany: (ids) => axiosClient.delete('/notificaciones/lote', { data: { ids } })
};
