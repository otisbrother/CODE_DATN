const axios = require('axios');
const env = require('../config/env');
const db = require('../config/db');

/**
 * Chatbot Service - Xử lý logic chatbot tư vấn khóa học
 * Hỗ trợ 2 chế độ:
 * 1. n8n mode: Forward câu hỏi tới n8n webhook để xử lý bằng LLM
 * 2. Fallback mode: Trả lời dựa trên dữ liệu khóa học trong DB
 */

// Lấy danh sách khóa học published từ DB
async function getPublishedCourses() {
  const [rows] = await db.query(`
    SELECT c.id, c.title, c.description, c.price, c.status,
           u.full_name AS lecturer_name
    FROM courses c
    LEFT JOIN users u ON c.lecturer_id = u.id
    WHERE c.status = 'published'
    ORDER BY c.created_at DESC
  `);
  return rows;
}

// Gọi n8n webhook (gửi kèm thông tin khóa học từ DB)
async function callN8nWebhook(question, sessionId) {
  const webhookUrl = env.N8N_CHATBOT_WEBHOOK_URL;

  if (!webhookUrl) {
    return null; // Không cấu hình n8n → fallback
  }

  try {
    // Lấy danh sách khóa học từ DB để gửi kèm cho n8n
    const courses = await getPublishedCourses();
    const coursesInfo = courses.map(c =>
      `- ${c.title}: ${c.description ? c.description.substring(0, 120) : ''} | Giá: ${Number(c.price).toLocaleString('vi-VN')}đ | GV: ${c.lecturer_name}`
    ).join('\n');

    const response = await axios.post(webhookUrl, {
      question,
      session_id: sessionId,
      courses_info: coursesInfo,
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    });

    // n8n trả về dạng mảng hoặc object
    const data = Array.isArray(response.data) ? response.data[0] : response.data;
    return data?.answer || data?.output || data?.text || null;
  } catch (error) {
    console.error('n8n webhook error:', error.message);
    return null; // Fallback nếu n8n lỗi
  }
}

// Fallback: Trả lời dựa trên dữ liệu khóa học
async function fallbackResponse(question) {
  const courses = await getPublishedCourses();
  const q = question.toLowerCase();

  // Tìm khóa học matching
  const matchedCourses = courses.filter(c =>
    c.title.toLowerCase().includes(q) ||
    (c.description && c.description.toLowerCase().includes(q))
  );

  // Câu hỏi về giá
  if (q.includes('giá') || q.includes('phí') || q.includes('bao nhiêu') || q.includes('chi phí')) {
    if (matchedCourses.length > 0) {
      const list = matchedCourses.map(c =>
        `• **${c.title}** — ${Number(c.price).toLocaleString('vi-VN')}đ (GV: ${c.lecturer_name})`
      ).join('\n');
      return `Thông tin học phí các khóa học phù hợp:\n\n${list}\n\nBạn muốn tìm hiểu thêm về khóa học nào?`;
    }
    const list = courses.map(c =>
      `• **${c.title}** — ${Number(c.price).toLocaleString('vi-VN')}đ`
    ).join('\n');
    return `Bảng giá các khóa học hiện có:\n\n${list}\n\nBạn quan tâm khóa học nào?`;
  }

  // Câu hỏi về danh sách khóa học
  if (q.includes('khóa học') || q.includes('khoá học') || q.includes('có gì') || q.includes('danh sách') || q.includes('những gì')) {
    const list = courses.map(c =>
      `• **${c.title}** — ${c.description ? c.description.substring(0, 80) + '...' : ''} (${Number(c.price).toLocaleString('vi-VN')}đ)`
    ).join('\n');
    return `Hệ thống hiện có **${courses.length}** khóa học:\n\n${list}\n\nBạn muốn biết thêm chi tiết về khóa học nào?`;
  }

  // Câu hỏi về giảng viên
  if (q.includes('giảng viên') || q.includes('giáo viên') || q.includes('ai dạy') || q.includes('thầy') || q.includes('cô')) {
    const lecturers = [...new Set(courses.map(c => c.lecturer_name))];
    const list = courses.map(c =>
      `• **${c.title}** — GV: ${c.lecturer_name}`
    ).join('\n');
    return `Đội ngũ giảng viên của chúng tôi gồm: ${lecturers.join(', ')}.\n\nChi tiết:\n${list}`;
  }

  // Câu hỏi về đăng ký
  if (q.includes('đăng ký') || q.includes('đăng kí') || q.includes('tham gia') || q.includes('mua')) {
    return `Để đăng ký khóa học, bạn cần:\n\n1. **Tạo tài khoản** bằng cách nhấn nút "Đăng ký" trên trang chủ\n2. **Chọn khóa học** bạn muốn tham gia\n3. **Thanh toán** học phí (hỗ trợ chuyển khoản ngân hàng)\n4. **Bắt đầu học** ngay sau khi thanh toán thành công\n\nBạn cần hỗ trợ thêm gì không?`;
  }

  // Câu chào
  if (q.includes('xin chào') || q.includes('hello') || q.includes('hi') || q === 'chào') {
    return `Xin chào! 👋 Tôi là trợ lý AI của **E-Learning**.\n\nTôi có thể giúp bạn:\n• Tìm hiểu về các **khóa học** hiện có\n• Thông tin **học phí** và **giảng viên**\n• Hướng dẫn **đăng ký** tài khoản\n• Giải đáp thắc mắc về hệ thống\n\nBạn muốn hỏi gì?`;
  }

  // Mặc định
  if (courses.length > 0) {
    const list = courses.slice(0, 3).map(c =>
      `• **${c.title}** (${Number(c.price).toLocaleString('vi-VN')}đ)`
    ).join('\n');
    return `Cảm ơn bạn đã quan tâm! Hiện tại hệ thống có **${courses.length}** khóa học.\n\nMột số khóa học nổi bật:\n${list}\n\nBạn có thể hỏi tôi về:\n• Danh sách khóa học\n• Học phí\n• Giảng viên\n• Cách đăng ký`;
  }

  return `Xin chào! Tôi là trợ lý AI của E-Learning. Bạn có thể hỏi tôi về các khóa học, học phí, giảng viên hoặc cách đăng ký!`;
}

// Hàm chính xử lý chatbot
async function askChatbot(question, sessionId) {
  // Thử gọi n8n trước
  const n8nAnswer = await callN8nWebhook(question, sessionId);

  if (n8nAnswer) {
    return { answer: n8nAnswer, source: 'n8n' };
  }

  // Fallback
  const answer = await fallbackResponse(question);
  return { answer, source: 'fallback' };
}

module.exports = { askChatbot };
