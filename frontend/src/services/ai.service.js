import axiosClient from './axiosClient';

export const aiService = {
  // AI Data Sources — giáo viên tự quản lý (không có duyệt)
  getDataByCourse: (courseId) => axiosClient.get(`/ai/data/course/${courseId}`),
  uploadData: (data) => axiosClient.post('/ai/data', data),
  updateData: (id, data) => axiosClient.put(`/ai/data/${id}`, data),
  deleteData: (id) => axiosClient.delete(`/ai/data/${id}`),
  // AI Conversations
  getConversations: (courseId) => axiosClient.get(`/ai/conversations/course/${courseId}`),
  getMessages: (conversationId) => axiosClient.get(`/ai/conversations/${conversationId}/messages`),
  // AI Chat
  chat: (data) => axiosClient.post('/ai/chat', data),
  learningAssistantQa: (data) => axiosClient.post('/ai/learning-assistant/qa', data),
  testLearningAssistant: (data) => axiosClient.post('/ai/learning-assistant/test', data),
  getLearningPath: (data) => axiosClient.post('/ai/learning-assistant/path', data),
  getStudySchedule: () => axiosClient.get('/ai/learning-assistant/schedule'),
  getSavedSchedule: () => axiosClient.get('/ai/learning-assistant/schedule/saved'),
  saveStudySchedule: (items) => axiosClient.put('/ai/learning-assistant/schedule/saved', { items }),
};
