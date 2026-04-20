import axiosClient from './axiosClient';

export const enrollmentService = {
  enroll: (data) => axiosClient.post('/enrollments', data),
  getMyEnrollments: () => axiosClient.get('/enrollments/my'),
  getCourseEnrollments: (courseId) => axiosClient.get(`/enrollments/course/${courseId}`),
};
