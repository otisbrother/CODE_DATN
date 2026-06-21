import axiosClient from './axiosClient';

export const userService = {
  getAll: (params) => axiosClient.get('/users', { params }),
  getById: (id) => axiosClient.get(`/users/${id}`),
  createLecturer: (data) => axiosClient.post('/users/lecturers', data),
  update: (id, data) => axiosClient.put(`/users/${id}`, data),
  remove: (id) => axiosClient.delete(`/users/${id}`),
};
