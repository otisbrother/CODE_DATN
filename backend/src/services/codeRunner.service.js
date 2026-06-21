/**
 * Engine chấm code tự động (kiểu LeetCode) cho JavaScript.
 * Chạy hàm solution(input) của học viên trong sandbox Node `vm` với từng testcase,
 * giới hạn thời gian để chống vòng lặp vô hạn, rồi so output với đáp án mong đợi.
 *
 * Hợp đồng: học viên viết `function solution(input) { ... return ketqua; }`
 * - `input`  : chuỗi đầu vào của testcase (học viên tự parse nếu cần).
 * - trả về   : kết quả; hệ thống so sánh String(ketqua).trim() với expected.trim().
 * - Nếu không return mà dùng console.log thì lấy nội dung in ra làm output.
 */
const vm = require('vm');

const TIME_LIMIT_MS = 2000; // mỗi testcase tối đa 2 giây

const normalizeOutput = (value) => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') {
    try { return JSON.stringify(value); } catch (e) { return String(value); }
  }
  return String(value);
};

// Chạy code 1 lần với 1 input. Trả { ok, output, error }.
const runOnce = (code, input) => {
  const logs = [];
  const sandbox = {
    __input: input,
    __out: undefined,
    console: {
      log: (...args) => logs.push(args.map(normalizeOutput).join(' ')),
      error: () => {},
      warn: () => {},
      info: () => {},
    },
  };
  const script = `${code}\n;__out = (typeof solution === 'function') ? solution(__input) : undefined;`;
  try {
    vm.runInNewContext(script, sandbox, { timeout: TIME_LIMIT_MS });
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    // vm ném lỗi timeout dạng "Script execution timed out"
    const isTimeout = /timed out/i.test(message);
    return { ok: false, output: '', error: isTimeout ? 'Quá thời gian (có thể bị lặp vô hạn)' : message };
  }
  let out = sandbox.__out;
  if (out === undefined && logs.length > 0) out = logs.join('\n');
  return { ok: true, output: normalizeOutput(out), error: null };
};

/**
 * Chạy toàn bộ testcase. Trả:
 * { passedCount, total, results:[{ index, passed, input, expected, actual, error, is_sample }] }
 */
const runJsSolution = (code, testCases = []) => {
  const results = testCases.map((tc, index) => {
    const expected = normalizeOutput(tc.expected).trim();
    if (!code || !String(code).trim()) {
      return { index, passed: false, input: tc.input, expected, actual: '', error: 'Chưa nộp code', is_sample: !!tc.is_sample };
    }
    const r = runOnce(code, tc.input);
    const actual = (r.output || '').trim();
    return {
      index,
      passed: r.ok && actual === expected,
      input: tc.input,
      expected,
      actual,
      error: r.error,
      is_sample: !!tc.is_sample,
    };
  });
  const passedCount = results.filter((r) => r.passed).length;
  return { passedCount, total: testCases.length, results };
};

module.exports = { runJsSolution };
