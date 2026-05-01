import axiosClient from './axiosClient';

export const courseService = {
  getAll: (params) => axiosClient.get('/courses', { params }),
  getById: (id) => axiosClient.get(`/courses/${id}`),
  create: (data) => axiosClient.post('/courses', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => axiosClient.put(`/courses/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  remove: (id) => axiosClient.delete(`/courses/${id}`),
};
