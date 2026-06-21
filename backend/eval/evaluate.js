/* =============================================================
 * BỘ KIỂM THỬ & ĐÁNH GIÁ ĐỘ CHÍNH XÁC THUẬT TOÁN / AI
 * Chạy: node backend/eval/evaluate.js
 * Đánh giá 3 thuật toán đang áp dụng trong hệ thống:
 *   1. Chấm điểm tự động (quiz / tự luận / code)
 *   2. Engine chạy code (sandbox vm)
 *   3. Chatbot tư vấn: phân loại ý định + khớp khóa học
 * Mọi số liệu in ra đều tính từ dữ liệu có ĐÁP ÁN CHUẨN (ground truth).
 * ============================================================= */
const grading = require('../src/services/assignmentGrading.service');
const { runJsSolution } = require('../src/services/codeRunner.service');
const chatbot = require('../src/services/chatbot.service');

let passAll = 0, totalAll = 0;
const section = (t) => console.log(`\n=== ${t} ===`);
const pct = (a, b) => (b === 0 ? 0 : Math.round((a / b) * 1000) / 10);

// Kiểm tra 1 assert, cộng dồn vào tổng
function check(name, ok) {
  totalAll += 1; if (ok) passAll += 1;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`);
  return ok;
}

/* ---------- 1. CHẤM ĐIỂM TỰ ĐỘNG ---------- */
section('1. THUẬT TOÁN CHẤM ĐIỂM TỰ ĐỘNG (gradeAssignment)');
const gradeCases = [
  {
    name: 'Quiz: 2/2 đúng -> 10đ',
    assignment: { max_score: 10, questions: [
      { type: 'quiz', prompt: 'HTML là gì?', options: ['Ngôn ngữ đánh dấu', 'Ngôn ngữ lập trình'], correct_option: 0 },
      { type: 'quiz', prompt: 'CSS dùng để?', options: ['Tạo CSDL', 'Định dạng giao diện'], correct_option: 1 },
    ]},
    answers: [0, 1], expectScore: 10,
  },
  {
    name: 'Quiz: 1/2 đúng -> 5đ',
    assignment: { max_score: 10, questions: [
      { type: 'quiz', prompt: 'q1', options: ['a', 'b'], correct_option: 0 },
      { type: 'quiz', prompt: 'q2', options: ['a', 'b'], correct_option: 1 },
    ]},
    answers: [0, 0], expectScore: 5,
  },
  {
    name: 'Tự luận theo từ khóa: khớp 2/4 ý -> 5đ',
    assignment: { max_score: 10, questions: [
      { type: 'essay', prompt: 'Nêu đặc điểm REST API', keywords: ['stateless', 'http', 'json', 'resource'] },
    ]},
    answers: ['REST API dùng giao thức http và trả về json'], expectScore: 5,
  },
  {
    name: 'Tự luận để trống -> 0đ',
    assignment: { max_score: 10, questions: [
      { type: 'essay', prompt: 'Giải thích JOIN', keywords: ['inner', 'left', 'khoa'] },
    ]},
    answers: [''], expectScore: 0,
  },
  {
    name: 'Hỗn hợp quiz+code: quiz đúng + code pass 2/2 -> 10đ',
    assignment: { max_score: 10, questions: [
      { type: 'quiz', prompt: 'q', options: ['a', 'b'], correct_option: 1 },
      { type: 'code', prompt: 'Tổng 2 số', test_cases: [
        { input: '2 3', expected: '5' }, { input: '10 20', expected: '30' },
      ]},
    ]},
    answers: [1, 'function solution(input){const [a,b]=input.split(" ").map(Number);return a+b;}'],
    expectScore: 10,
  },
];
let gOK = 0;
for (const c of gradeCases) {
  const res = grading.gradeAssignment(c.assignment, c.answers);
  const ok = res && Math.abs(res.score - c.expectScore) < 0.01;
  if (check(`${c.name} (chấm=${res ? res.score : 'null'}, kỳ vọng=${c.expectScore})`, ok)) gOK += 1;
}
console.log(`  -> Độ chính xác chấm điểm: ${gOK}/${gradeCases.length} = ${pct(gOK, gradeCases.length)}%`);

/* ---------- 2. ENGINE CHẠY CODE (sandbox) ---------- */
section('2. ENGINE CHẤM CODE (runJsSolution)');
const codeCases = [
  { name: 'Lời giải đúng pass 3/3', code: 'function solution(i){const[a,b]=i.split(" ").map(Number);return a+b;}',
    tests: [{input:'1 1',expected:'2'},{input:'2 5',expected:'7'},{input:'10 10',expected:'20'}], expectPass: 3 },
  { name: 'Lời giải sai pass 0/2', code: 'function solution(i){return 0;}',
    tests: [{input:'1 1',expected:'2'},{input:'2 5',expected:'7'}], expectPass: 0 },
  { name: 'Vòng lặp vô hạn -> timeout, không pass', code: 'function solution(i){while(true){}}',
    tests: [{input:'x',expected:'1'}], expectPass: 0 },
  { name: 'Dùng console.log thay return', code: 'function solution(i){console.log(i.toUpperCase());}',
    tests: [{input:'abc',expected:'ABC'}], expectPass: 1 },
];
let cOK = 0;
for (const c of codeCases) {
  const r = runJsSolution(c.code, c.tests);
  const ok = r.passedCount === c.expectPass;
  if (check(`${c.name} (pass=${r.passedCount}/${r.total}, kỳ vọng=${c.expectPass})`, ok)) cOK += 1;
}
console.log(`  -> Độ chính xác engine code: ${cOK}/${codeCases.length} = ${pct(cOK, codeCases.length)}%`);

/* ---------- 3. CHATBOT: PHÂN LOẠI Ý ĐỊNH ---------- */
section('3a. CHATBOT - PHÂN LOẠI Ý ĐỊNH (intent classification)');
// nhãn: beginner | voucher | procedural | general
const intentCases = [
  ['Em mất gốc lập trình nên bắt đầu từ đâu?', 'beginner'],
  ['Lộ trình học cho người mới là gì?', 'beginner'],
  ['Có voucher hay mã giảm giá nào không?', 'voucher'],
  ['Đang có khuyến mãi gì cho khóa web không?', 'voucher'],
  ['Cách đăng ký khóa học như thế nào?', 'procedural'],
  ['Hướng dẫn cách thanh toán giúp mình', 'procedural'],
  ['Khóa MySQL học phí bao nhiêu?', 'general'],
  ['Ai dạy khóa NodeJS vậy?', 'general'],
];
const predictIntent = (q) => {
  if (chatbot.isBeginnerAdviceQuestion(q)) return 'beginner';
  if (chatbot.isVoucherQuestion(q)) return 'voucher';
  if (chatbot.isProceduralQuestion(q)) return 'procedural';
  return 'general';
};
let iOK = 0;
for (const [q, label] of intentCases) {
  const pred = predictIntent(q);
  const ok = pred === label;
  if (check(`"${q}" -> ${pred} (đúng: ${label})`, ok)) iOK += 1;
}
console.log(`  -> Accuracy phân loại ý định: ${iOK}/${intentCases.length} = ${pct(iOK, intentCases.length)}%`);

/* ---------- 3b. CHATBOT: KHỚP KHÓA HỌC ---------- */
section('3b. CHATBOT - KHỚP KHÓA HỌC THEO CÂU HỎI (pickMatchedCourses)');
const catalog = [
  { id: 1, title: 'Lập trình Web cơ bản', short_description: 'HTML CSS JavaScript cho người mới', description: 'web html css js', price: 500000, lecturer_name: 'GV A', status: 'published' },
  { id: 2, title: 'Cơ sở dữ liệu MySQL', short_description: 'MySQL từ cơ bản đến nâng cao', description: 'sql truy van du lieu database', price: 350000, lecturer_name: 'GV A', status: 'published' },
  { id: 3, title: 'NodeJS và Express', short_description: 'Backend REST API', description: 'nodejs express rest api', price: 450000, lecturer_name: 'GV B', status: 'published' },
  { id: 4, title: 'Nhập môn lập trình', short_description: 'Lập trình cơ bản cho người mới', description: 'programming basics nhap mon', price: 0, lecturer_name: 'GV B', status: 'published' },
  { id: 5, title: 'Lập trình hướng đối tượng nâng cao', short_description: 'OOP nâng cao', description: 'oop huong doi tuong nang cao', price: 600000, lecturer_name: 'GV A', status: 'published' },
  { id: 6, title: 'Cấu trúc dữ liệu và giải thuật', short_description: 'CTDL và thuật toán', description: 'cau truc du lieu giai thuat algorithm', price: 700000, lecturer_name: 'GV B', status: 'published' },
  { id: 7, title: 'Trí tuệ nhân tạo cơ bản', short_description: 'Machine learning nhập môn', description: 'ai tri tue nhan tao machine learning', price: 800000, lecturer_name: 'GV A', status: 'published' },
];
const learningPath = chatbot.buildLearningPath(catalog);
// mỗi truy vấn -> id khóa kỳ vọng đứng đầu kết quả
const matchCases = [
  ['Tôi muốn học mysql', 2],
  ['Khóa học về cấu trúc dữ liệu', 6],
  ['Học AI machine learning', 7],
  ['Lập trình web html css', 1],
  ['Khóa nodejs express', 3],
  ['Học lập trình hướng đối tượng', 5],
  ['nhập môn lập trình cho người mới', 4],
];
let mOK = 0;
for (const [q, expId] of matchCases) {
  const ranked = chatbot.pickMatchedCourses(learningPath, q);
  const top = ranked[0];
  const ok = top && Number(top.id) === expId;
  if (check(`"${q}" -> top=#${top ? top.id : '-'} (đúng: #${expId})`, ok)) mOK += 1;
}
console.log(`  -> Top-1 accuracy khớp khóa học: ${mOK}/${matchCases.length} = ${pct(mOK, matchCases.length)}%`);

/* ---------- TỔNG KẾT ---------- */
section('TỔNG KẾT TOÀN BỘ');
const blocks = [
  ['Chấm điểm tự động', gOK, gradeCases.length],
  ['Engine chạy code', cOK, codeCases.length],
  ['Phân loại ý định chatbot', iOK, intentCases.length],
  ['Khớp khóa học (Top-1)', mOK, matchCases.length],
];
for (const [n, a, b] of blocks) console.log(`  ${n.padEnd(28)} ${a}/${b}  = ${pct(a, b)}%`);
console.log(`  ${'TỔNG'.padEnd(28)} ${passAll}/${totalAll}  = ${pct(passAll, totalAll)}%`);
process.exit(passAll === totalAll ? 0 : 1);
