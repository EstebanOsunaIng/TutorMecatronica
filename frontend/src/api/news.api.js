import axiosClient from './axiosClient.js';

export const newsApi = {
  list: (category) => axiosClient.get('/news', { params: { category } }),
  refresh: () => axiosClient.post('/news/refresh')
};
