import axiosClient from './axiosClient.js';

export const presenceApi = {
  ping: () => axiosClient.post('/presence/ping')
};
