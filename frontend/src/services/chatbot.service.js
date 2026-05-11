import axiosClient from './axiosClient';

export const chatbotService = {
  ask: (question, sessionId) =>
    axiosClient.post('/chatbot/ask', { question, session_id: sessionId }),
};
