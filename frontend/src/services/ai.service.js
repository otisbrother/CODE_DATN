import axiosClient from './axiosClient';

export const aiService = {
  // AI Data Sources
  getAllData: (status) => axiosClient.get('/ai/data', { params: { status } }),
  getDataByCourse: (courseId) => axiosClient.get(`/ai/data/course/${courseId}`),
  uploadData: (data) => axiosClient.post('/ai/data', data),
  approveData: (id) => axiosClient.put(`/ai/data/${id}/approve`),
  rejectData: (id) => axiosClient.put(`/ai/data/${id}/reject`),
  // AI Conversations
  getConversations: (courseId) => axiosClient.get(`/ai/conversations/course/${courseId}`),
  getMessages: (conversationId) => axiosClient.get(`/ai/conversations/${conversationId}/messages`),
  // AI Chat
  chat: (data) => axiosClient.post('/ai/chat', data),
};
