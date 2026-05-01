import axiosClient from './axiosClient';

export const lessonService = {
  getByCourse: (courseId) => axiosClient.get(`/lessons/course/${courseId}`),
  getById: (id) => axiosClient.get(`/lessons/${id}`),
  create: (data) => axiosClient.post('/lessons', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => axiosClient.put(`/lessons/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  remove: (id) => axiosClient.delete(`/lessons/${id}`),
  uploadMaterial: (lessonId, formData) => axiosClient.post(`/lessons/${lessonId}/materials`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getMaterials: (lessonId) => axiosClient.get(`/lessons/${lessonId}/materials`),
  removeMaterial: (id) => axiosClient.delete(`/lessons/materials/${id}`),
};
