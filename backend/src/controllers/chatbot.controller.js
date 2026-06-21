const chatbotService = require('../services/chatbot.service');
const ApiResponse = require('../utils/apiResponse');

/**
 * Chatbot Controller - API tư vấn khóa học
 * Không yêu cầu đăng nhập (public endpoint)
 */

const askChatbot = async (req, res) => {
  try {
    const { question, session_id } = req.body;

    if (!question || !question.trim()) {
      return ApiResponse.error(res, 'Vui lòng nhập câu hỏi', 400);
    }

    const sessionId = session_id || `session_${Date.now()}`;
    const result = await chatbotService.askChatbot(question.trim(), sessionId);

    return ApiResponse.success(res, {
      answer: result.answer,
      source: result.source,
      session_id: sessionId,
      related_courses: result.related_courses || [],
    });
  } catch (err) {
    console.error('Chatbot error:', err);
    return ApiResponse.error(res, 'Có lỗi xảy ra, vui lòng thử lại sau', 500);
  }
};

module.exports = { askChatbot };
