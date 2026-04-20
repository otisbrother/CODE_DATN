import axiosClient from './axiosClient';

export const courseService = {
  getAll: (params) => axiosClient.get('/courses', { params }),
  getById: (id) => axiosClient.get(`/courses/${id}`),
  create: (data) => axiosClient.post('/courses', data),
  update: (id, data) => axiosClient.put(`/courses/${id}`, data),
  remove: (id) => axiosClient.delete(`/courses/${id}`),
};
