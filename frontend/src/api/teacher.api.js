import axiosClient from './axiosClient.js';

export const teacherApi = {
  listStudents: (q) => axiosClient.get('/teacher/students', { params: { q } }),
  studentProgress: (studentId) => axiosClient.get(`/teacher/students/${studentId}/progress`),
  exportStudentsCsv: () => axiosClient.get('/teacher/students/export', { responseType: 'blob' })
};
