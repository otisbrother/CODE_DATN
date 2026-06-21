const { runJsSolution } = require('./codeRunner.service');

const removeAccents = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

const normalizeText = (value) => removeAccents(value)
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const roundScore = (value) => Math.round(value * 100) / 100;

const parseJson = (value, fallback) => {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};

const toList = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || '')
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeTestCases = (list) => (Array.isArray(list) ? list : []).map((tc) => ({
  input: String(tc.input ?? ''),
  expected: String(tc.expected ?? ''),
  is_sample: Boolean(tc.is_sample),
}));

const normalizeQuestion = (question, index) => {
  const type = ['essay', 'code', 'quiz'].includes(question.type) ? question.type : 'quiz';
  return {
    id: question.id || `q_${index + 1}`,
    type,
    prompt: String(question.prompt || '').trim(),
    options: Array.isArray(question.options)
      ? question.options.map((option) => String(option || '').trim())
      : [],
    correct_option: question.correct_option !== undefined ? Number(question.correct_option) : null,
    expected_answer: String(question.expected_answer || '').trim(),
    keywords: toList(question.keywords),
    starter_code: String(question.starter_code || ''),
    test_cases: normalizeTestCases(question.test_cases),
  };
};

const normalizeQuestions = (assignment) => {
  const rawQuestions = assignment.questions || parseJson(assignment.questions_json, []);
  if (!Array.isArray(rawQuestions)) return [];
  return rawQuestions.map(normalizeQuestion).filter((question) => question.prompt);
};

const validateQuestions = (questions) => {
  if (!Array.isArray(questions) || questions.length === 0) {
    return 'Cần tạo ít nhất 1 câu hỏi để hệ thống tự chấm.';
  }

  for (let index = 0; index < questions.length; index += 1) {
    const question = normalizeQuestion(questions[index], index);
    if (!question.prompt) return `Câu ${index + 1} chưa có đề bài.`;

    if (question.type === 'quiz') {
      const validOptions = question.options.filter(Boolean);
      if (validOptions.length < 2) return `Câu trắc nghiệm ${index + 1} cần ít nhất 2 đáp án.`;
      if (!Number.isInteger(question.correct_option) || question.correct_option < 0 || question.correct_option >= question.options.length) {
        return `Câu trắc nghiệm ${index + 1} chưa chọn đáp án đúng.`;
      }
      if (!question.options[question.correct_option]) return `Đáp án đúng của câu ${index + 1} đang để trống.`;
    }

    if (question.type === 'essay' && !question.expected_answer && question.keywords.length === 0) {
      return `Câu tự luận ${index + 1} cần đáp án mẫu hoặc từ khóa để tự chấm.`;
    }

    if (question.type === 'code') {
      const validTests = question.test_cases.filter((tc) => String(tc.expected).trim() !== '');
      if (validTests.length === 0) {
        return `Câu code ${index + 1} cần ít nhất 1 testcase có kết quả mong đợi.`;
      }
    }
  }

  return null;
};

const getAnswerForQuestion = (answers, question, index) => {
  if (!answers) return '';
  if (Array.isArray(answers)) return answers[index];
  if (Object.prototype.hasOwnProperty.call(answers, question.id)) return answers[question.id];
  return answers[index] || '';
};

const gradeEssay = (question, answer) => {
  const normalizedAnswer = normalizeText(answer);
  if (!normalizedAnswer) {
    return { ratio: 0, feedback: 'chưa trả lời' };
  }

  const keywords = question.keywords.map(normalizeText).filter(Boolean);
  if (keywords.length > 0) {
    const matched = keywords.filter((keyword) => normalizedAnswer.includes(keyword)).length;
    return {
      ratio: matched / keywords.length,
      feedback: `khớp ${matched}/${keywords.length} ý chính`,
    };
  }

  const expectedWords = normalizeText(question.expected_answer)
    .split(' ')
    .filter((word) => word.length >= 3);

  if (expectedWords.length === 0) {
    return { ratio: 0, feedback: 'thiếu đáp án mẫu' };
  }

  const answerWords = new Set(normalizedAnswer.split(' '));
  const matchedWords = expectedWords.filter((word) => answerWords.has(word)).length;
  return {
    ratio: matchedWords / expectedWords.length,
    feedback: `khớp ${matchedWords}/${expectedWords.length} từ trong đáp án mẫu`,
  };
};

const gradeAssignment = (assignment, rawAnswers) => {
  const questions = normalizeQuestions(assignment);
  if (questions.length === 0) return null;

  const maxScore = Number(assignment.max_score) > 0 ? Number(assignment.max_score) : 10;
  const answers = parseJson(rawAnswers, rawAnswers);
  let totalRatio = 0;
  let correctQuiz = 0;
  let quizCount = 0;
  const details = [];
  const report = []; // chi tiết trả về cho học viên (không lưu DB)

  questions.forEach((question, index) => {
    const answer = getAnswerForQuestion(answers, question, index);

    if (question.type === 'quiz') {
      quizCount += 1;
      const selected = Number(answer);
      const isCorrect = selected === question.correct_option;
      if (isCorrect) correctQuiz += 1;
      totalRatio += isCorrect ? 1 : 0;
      details.push(`Câu ${index + 1}: ${isCorrect ? 'đúng' : 'sai'}`);
      report.push({ index, type: 'quiz', correct: isCorrect });
      return;
    }

    if (question.type === 'code') {
      const run = runJsSolution(answer, question.test_cases);
      const ratio = run.total > 0 ? run.passedCount / run.total : 0;
      totalRatio += ratio;
      details.push(`Câu ${index + 1} (code): pass ${run.passedCount}/${run.total} testcase`);
      report.push({
        index,
        type: 'code',
        passed: run.passedCount,
        total: run.total,
        // chỉ trả chi tiết testcase mẫu; testcase ẩn chỉ báo pass/fail, không lộ input/expected
        results: run.results.map((r) => (r.is_sample
          ? r
          : { index: r.index, passed: r.passed, is_sample: false, hidden: true })),
      });
      return;
    }

    const result = gradeEssay(question, answer);
    totalRatio += result.ratio;
    details.push(`Câu ${index + 1}: ${result.feedback}`);
    report.push({ index, type: 'essay', feedback: result.feedback });
  });

  const score = roundScore((totalRatio / questions.length) * maxScore);
  const quizSummary = quizCount > 0 ? `Trắc nghiệm đúng ${correctQuiz}/${quizCount}. ` : '';
  return {
    score,
    feedback: `Hệ thống tự chấm thang điểm ${maxScore}. ${quizSummary}${details.join('; ')}.`,
    report,
  };
};

module.exports = {
  normalizeQuestions,
  validateQuestions,
  gradeAssignment,
  parseJson,
};
