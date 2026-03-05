import axiosClient from './axiosClient.js';

export const gamificationApi = {
  badges: () => axiosClient.get('/gamification/badges'),
  top5: () => axiosClient.get('/gamification/ranking/top5'),
  myRank: () => axiosClient.get('/gamification/ranking/me')
};
