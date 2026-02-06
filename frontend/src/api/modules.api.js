import axiosClient from './axiosClient.js';

export const modulesApi = {
  list: () => axiosClient.get('/modules'),
  listPublished: () => axiosClient.get('/modules/published'),
  get: (id) => axiosClient.get(`/modules/${id}`),
  create: (payload) => axiosClient.post('/modules', payload),
  importPdf: (file) => {
    const form = new FormData();
    form.append('file', file);
    return axiosClient.post('/modules/import/pdf', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  update: (id, payload) => axiosClient.put(`/modules/${id}`, payload),
  remove: (id) => axiosClient.delete(`/modules/${id}`),
  addLevel: (moduleId, payload) => axiosClient.post(`/modules/${moduleId}/levels`, payload),
  updateLevel: (moduleId, levelId, payload) =>
    axiosClient.put(`/modules/${moduleId}/levels/${levelId}`, payload),
  removeLevel: (moduleId, levelId) =>
    axiosClient.delete(`/modules/${moduleId}/levels/${levelId}`)
};
