import axiosClient from './axiosClient.js';

export const authApi = {
  login: (payload) => axiosClient.post('/auth/login', payload),
  register: (payload) => axiosClient.post('/auth/register', payload),
  forgot: (payload) => axiosClient.post('/auth/forgot-password', payload),
  reset: (payload) => axiosClient.post('/auth/reset-password', payload),
  changePassword: (payload) => axiosClient.post('/auth/change-password', payload),
  requestPasswordChangeConfirmation: (payload) => axiosClient.post('/auth/change-password/request-confirmation', payload),
  getPasswordChangeStatus: (requestId) => axiosClient.get(`/auth/change-password/status/${requestId}`),
  completePasswordChange: (payload) => axiosClient.post('/auth/change-password/complete', payload)
};
