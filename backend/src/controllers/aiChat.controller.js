const aiConvRepo = require('../repositories/aiConversations.repository');
const aiDataRepo = require('../repositories/aiData.repository');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getConversations = asyncHandler(async (req, res) => {
  const data = await aiConvRepo.findByStudentAndCourse(req.user.id, req.params.courseId);
  return ApiResponse.success(res, data);
});

const getMessages = asyncHandler(async (req, res) => {
  const conv = await aiConvRepo.findById(req.params.conversationId);
  if (!conv) return ApiResponse.notFound(res, 'Hội thoại không tồn tại');
  if (conv.student_id !== req.user.id) return ApiResponse.forbidden(res);
  const messages = await aiConvRepo.getMessages(req.params.conversationId);
  return ApiResponse.success(res, messages);
});

const chat = asyncHandler(async (req, res) => {
  const { course_id, conversation_id, message } = req.body;

  let convId = conversation_id;
  if (!convId) {
    convId = await aiConvRepo.create(req.user.id, course_id);
  }

  // Save student message
  await aiConvRepo.addMessage(convId, 'student', message);

  // Get AI context from approved data sources
  const aiData = await aiDataRepo.getApprovedByCourse(course_id);
  const context = aiData.map((d) => d.content).filter(Boolean).join('\n');

  // Mock AI response (replace with real OpenAI call later)
  let aiResponse;
  if (context) {
    aiResponse = `Dựa trên nội dung khóa học, đây là câu trả lời cho câu hỏi "${message}":\n\n`
      + `Theo tài liệu học tập, ${context.substring(0, 200)}...\n\n`
      + `Bạn có thể tham khảo thêm trong bài học để hiểu rõ hơn. Hãy hỏi thêm nếu cần!`;
  } else {
    aiResponse = `Cảm ơn bạn đã đặt câu hỏi: "${message}"\n\n`
      + `Hiện tại chưa có dữ liệu AI được kích hoạt cho khóa học này. `
      + `Vui lòng liên hệ giảng viên để được hỗ trợ thêm.`;
  }

  // Save AI response
  await aiConvRepo.addMessage(convId, 'ai', aiResponse);

  const messages = await aiConvRepo.getMessages(convId);
  return ApiResponse.success(res, { conversation_id: convId, messages }, 'AI đã trả lời');
});

module.exports = { getConversations, getMessages, chat };
