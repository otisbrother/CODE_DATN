import axiosClient from './axiosClient';

export const enrollmentService = {
  enroll: (data) => axiosClient.post('/enrollments', data),
  checkEnrollment: (courseId) => axiosClient.get(`/enrollments/check/${courseId}`),
  getMyEnrollments: () => axiosClient.get('/enrollments/my'),
  getCourseEnrollments: (courseId) => axiosClient.get(`/enrollments/course/${courseId}`),
};

export const paymentService = {
  getMyPayments: () => axiosClient.get('/payments/my'),
  getAllPayments: (status) => axiosClient.get('/payments', { params: { status } }),
  getPaymentStatus: (paymentId) => axiosClient.get(`/payments/${paymentId}/status`),
};
