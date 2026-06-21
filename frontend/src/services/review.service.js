import axiosClient from './axiosClient';

export const reviewService = {
  // Public
  getTrending: () => axiosClient.get('/reviews/trending'),
  getWithRatings: () => axiosClient.get('/reviews/with-ratings'),
  getReviews: (courseId) => axiosClient.get(`/reviews/${courseId}/reviews`),

  // Student (authenticated)
  checkCanReview: (courseId) => axiosClient.get(`/reviews/${courseId}/reviews/check`),
  createReview: (courseId, data) => axiosClient.post(`/reviews/${courseId}/reviews`, data),

  // Lecturer/Admin: phản hồi <=2 sao
  getFeedback: () => axiosClient.get('/reviews/feedback'),
};
