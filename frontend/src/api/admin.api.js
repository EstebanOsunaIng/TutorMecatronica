import axiosClient from './axiosClient.js';

export const adminApi = {
  createTeacherCode: () => axiosClient.post('/admin/teacher-codes'),
  listTeacherCodes: () => axiosClient.get('/admin/teacher-codes'),
  dashboard: (params = {}) => axiosClient.get('/admin/dashboard', { params })
};
