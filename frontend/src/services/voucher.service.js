import axiosClient from './axiosClient';

export const voucherService = {
  getPublicPromotions: (params) => axiosClient.get('/vouchers/public/promotions', { params }),
  getPublicPromotionById: (id) => axiosClient.get(`/vouchers/public/promotions/${id}`),
  getAll: (params) => axiosClient.get('/vouchers', { params }),
  getById: (id) => axiosClient.get(`/vouchers/${id}`),
  create: (data) => axiosClient.post('/vouchers', data),
  update: (id, data) => axiosClient.put(`/vouchers/${id}`, data),
  remove: (id) => axiosClient.delete(`/vouchers/${id}`),
  previewForCourse: (courseId, params) => axiosClient.get(`/vouchers/preview/course/${courseId}`, { params }),
};
