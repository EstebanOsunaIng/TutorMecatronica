import axiosClient from './axiosClient.js';

export const teacherApi = {
  listStudents: (params = {}) => {
    if (typeof params === 'string') {
      return axiosClient.get('/teacher/students', { params: { q: params } });
    }
    return axiosClient.get('/teacher/students', { params });
  },
  studentProgress: (studentId) => axiosClient.get(`/teacher/students/${studentId}/progress`),
  exportStudentsCsv: (params = {}) => axiosClient.get('/teacher/students/export', { params, responseType: 'blob' })
};
