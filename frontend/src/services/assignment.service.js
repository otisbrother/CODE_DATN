import axiosClient from './axiosClient';

export const assignmentService = {
  getByCourse: (courseId) => axiosClient.get(`/assignments/course/${courseId}`),
  getById: (id) => axiosClient.get(`/assignments/${id}`),
  create: (data) => axiosClient.post('/assignments', data),
  update: (id, data) => axiosClient.put(`/assignments/${id}`, data),
  remove: (id) => axiosClient.delete(`/assignments/${id}`),
  submit: (data) => axiosClient.post('/assignments/submit', data),
  getMySubmissions: () => axiosClient.get('/assignments/submissions/my'),
  getSubmissionsByAssignment: (assignmentId) => axiosClient.get(`/assignments/submissions/assignment/${assignmentId}`),
  grade: (data) => axiosClient.post('/assignments/grade', data),
};
