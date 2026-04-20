import axiosClient from './axiosClient';

export const progressService = {
  getMyProgress: () => axiosClient.get('/progress/my'),
  getCourseProgress: (courseId) => axiosClient.get(`/progress/course/${courseId}`),
  completeLesson: (courseId) => axiosClient.post('/progress/complete-lesson', { course_id: courseId }),
  recalculate: (courseId) => axiosClient.post('/progress/recalculate', { course_id: courseId }),
};
