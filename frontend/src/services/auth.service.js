import axiosClient from './axiosClient';

export const authService = {
  login: (data) => axiosClient.post('/auth/login', data),
  googleLogin: (data) => axiosClient.post('/auth/google', data),
  register: (data) => axiosClient.post('/auth/register', data),
  getProfile: () => axiosClient.get('/auth/profile'),
};
