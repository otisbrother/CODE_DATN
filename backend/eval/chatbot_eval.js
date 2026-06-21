/* Đo CHẤT LƯỢNG CHATBOT TƯ VẤN (end-to-end, gọi AI thật + DB thật).
 * Chạy: node eval/chatbot_eval.js
 * Đo: (1) độ liên quan/khớp khóa học, (2) xử lý câu ngoài phạm vi, (3) thời gian phản hồi. */
const chatbot = require('../src/services/chatbot.service');
const db = require('../src/config/db');

// Câu hỏi đúng chủ đề -> kỳ vọng có khóa học liên quan trả về
const RELEVANT = [
  'Tôi muốn học mysql',
  'Khóa cấu trúc dữ liệu và giải thuật',
  'Tôi muốn học AI',
  'Học lập trình web',
  'Nhập môn lập trình cho người mới bắt đầu',
  'Khóa điện toán đám mây',
];
// Câu hỏi NGOÀI phạm vi -> kỳ vọng KHÔNG bịa khóa học
const OUT_OF_SCOPE = [
  'Thời tiết hôm nay thế nào?',
  'Công thức nấu phở bò ngon',
  'Kết quả bóng đá tối qua',
];

const pct = (a, b) => (b === 0 ? 0 : Math.round((a / b) * 1000) / 10);

(async () => {
  let relevantHit = 0;
  let oosOk = 0;
  const times = [];
  let geminiCount = 0;

  console.log('=== CÂU HỎI ĐÚNG CHỦ ĐỀ (kỳ vọng: trả về khóa học liên quan) ===');
  for (const q of RELEVANT) {
    const t0 = Date.now();
    const res = await chatbot.askChatbot(q, 'eval');
    const ms = Date.now() - t0;
    times.push(ms);
    if (res.source === 'gemini') geminiCount += 1;
    const hasRelated = Array.isArray(res.related_courses) && res.related_courses.length > 0;
    if (hasRelated) relevantHit += 1;
    console.log(`  [${hasRelated ? 'OK' : 'MISS'}] "${q}" -> ${res.related_courses.length} khóa liên quan | nguồn=${res.source} | ${ms}ms`);
  }

  console.log('\n=== CÂU HỎI NGOÀI PHẠM VI (kỳ vọng: KHÔNG bịa khóa học) ===');
  for (const q of OUT_OF_SCOPE) {
    const t0 = Date.now();
    const res = await chatbot.askChatbot(q, 'eval');
    const ms = Date.now() - t0;
    times.push(ms);
    if (res.source === 'gemini') geminiCount += 1;
    const noFabricated = !res.related_courses || res.related_courses.length === 0;
    if (noFabricated) oosOk += 1;
    console.log(`  [${noFabricated ? 'OK' : 'BỊA'}] "${q}" -> ${res.related_courses?.length || 0} khóa | nguồn=${res.source} | ${ms}ms`);
  }

  const total = RELEVANT.length + OUT_OF_SCOPE.length;
  const avgMs = Math.round(times.reduce((a, b) => a + b, 0) / times.length);

  console.log('\n=== KẾT QUẢ ===');
  console.log(`  Độ liên quan (trả đúng khóa học): ${relevantHit}/${RELEVANT.length} = ${pct(relevantHit, RELEVANT.length)}%`);
  console.log(`  Xử lý câu ngoài phạm vi:          ${oosOk}/${OUT_OF_SCOPE.length} = ${pct(oosOk, OUT_OF_SCOPE.length)}%`);
  console.log(`  Dùng AI (Gemini) thật:            ${geminiCount}/${total} câu`);
  console.log(`  Thời gian phản hồi trung bình:    ${avgMs} ms (${(avgMs / 1000).toFixed(2)} giây)`);
  await db.end();
  process.exit(0);
})().catch((e) => { console.error('❌', e.message); process.exit(1); });
