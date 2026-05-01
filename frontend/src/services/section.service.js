import axiosClient from './axiosClient';

export const sectionService = {
  getByCourse: (courseId) => axiosClient.get(`/sections/course/${courseId}`),
  getById: (id) => axiosClient.get(`/sections/${id}`),
  create: (data) => axiosClient.post('/sections', data),
  update: (id, data) => axiosClient.put(`/sections/${id}`, data),
  remove: (id) => axiosClient.delete(`/sections/${id}`),
};
