import axiosClient from './axiosClient.js';

export const newsApi = {
  list: (category) => axiosClient.get('/news', { params: { category } }),
  refresh: (force = false) =>
    axiosClient.post('/news/refresh', {}, { params: force ? { force: 1 } : undefined })
};
