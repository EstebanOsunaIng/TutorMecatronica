import axiosClient from './axiosClient.js';

export const knowledgeApi = {
  list: (params) => axiosClient.get('/knowledge', { params }),
  upload: ({ file, title, moduleId, levelId, onUploadProgress }) => {
    const form = new FormData();
    form.append('file', file);
    if (title) form.append('title', title);
    if (moduleId) form.append('moduleId', moduleId);
    if (levelId) form.append('levelId', levelId);
    return axiosClient.post('/knowledge/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress
    });
  },
  remove: (id) => axiosClient.delete(`/knowledge/${id}`)
};
