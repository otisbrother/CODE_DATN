import axiosClient from './axiosClient';

export const progressService = {
  getMyProgress: () => axiosClient.get('/progress/my'),
  getCourseProgress: (courseId) => axiosClient.get(`/progress/course/${courseId}`),
  completeLesson: (courseId, lessonId) => axiosClient.post('/progress/complete-lesson', { course_id: courseId, lesson_id: lessonId }),
  recalculate: (courseId) => axiosClient.post('/progress/recalculate', { course_id: courseId }),
  getAll: () => axiosClient.get('/progress/all'),
};
