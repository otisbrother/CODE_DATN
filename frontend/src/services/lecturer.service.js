import axiosClient from './axiosClient';

export const lecturerService = {
  // Public
  getAll: () => axiosClient.get('/lecturers'),
  getById: (id) => axiosClient.get(`/lecturers/${id}`),
  // Lecturer (auth)
  getMyProfile: () => axiosClient.get('/lecturers/me/profile'),
  updateMyProfile: (formData) => axiosClient.put('/lecturers/me/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};
