const assignRepo = require('../repositories/assignments.repository');
const subRepo = require('../repositories/submissions.repository');
const resultRepo = require('../repositories/results.repository');
const coursesRepo = require('../repositories/courses.repository');
const enrollRepo = require('../repositories/enrollments.repository');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const {
  normalizeQuestions,
  validateQuestions,
  gradeAssignment,
} = require('../services/assignmentGrading.service');

const AUTO_GRADE_TYPES = ['quiz', 'essay', 'mixed', 'code'];

const makeError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeAssignmentPayload = (body) => {
  const assignmentType = AUTO_GRADE_TYPES.includes(body.assignment_type) ? body.assignment_type : 'manual';
  const questions = Array.isArray(body.questions) ? body.questions : [];
  const payload = {
    ...body,
    assignment_type: assignmentType,
    max_score: Number(body.max_score || 10),
    auto_grade: assignmentType !== 'manual',
    is_final_test: Boolean(body.is_final_test),
  };

  if (assignmentType === 'manual') {
    payload.questions = [];
    payload.auto_grade = false;
    return payload;
  }

  const questionError = validateQuestions(questions);
  if (questionError) throw makeError(questionError);

  payload.max_score = 10;
  payload.questions = normalizeQuestions({ questions });
  return payload;
};

// Loai bo dap an dung khoi cau hoi truoc khi tra ve cho hoc vien
const stripAnswers = (assignment) => {
  if (!assignment || !Array.isArray(assignment.questions)) return assignment;
  return {
    ...assignment,
    questions: assignment.questions.map((q) => {
      const { correct_option, expected_answer, keywords, ...safe } = q;
      // Voi bai code: chi cho hoc vien thay testcase mau (vi du), an testcase cham diem
      if (q.type === 'code' && Array.isArray(q.test_cases)) {
        safe.test_cases = q.test_cases.filter((tc) => tc.is_sample);
      }
      return safe;
    }),
  };
};

// Lecturer chi duoc thao tac tren bai tap thuoc khoa hoc cua minh (admin bo qua)
const ensureLecturerOwnsAssignment = async (req, res, assignment) => {
  if (req.user.role_name !== 'lecturer') return true;
  const course = await coursesRepo.findById(assignment.course_id);
  if (!course || course.lecturer_id !== req.user.id) {
    ApiResponse.forbidden(res, 'Bạn không có quyền thao tác trên bài tập của khóa học này');
    return false;
  }
  return true;
};

const ensureStudentCanAccessAssignment = async (studentId, assignment, actionLabel) => {
  const enrollment = await enrollRepo.findByUserAndCourse(studentId, assignment.course_id);
  if (!enrollment || enrollment.access_status !== 'active') {
    throw makeError(`Bạn cần đăng ký khóa học để ${actionLabel}.`, 403);
  }
  if (enrollment.is_preserved) {
    throw makeError('Khóa học đang bảo lưu. Vui lòng mở lại khóa học để tiếp tục học.', 403);
  }
};

// ---- Assignments ----
const getAssignmentsByCourse = asyncHandler(async (req, res) => {
  const data = await assignRepo.findByCourse(req.params.courseId);

  // Chi giang vien so huu khoa hoc hoac admin moi thay dap an dung
  let canSeeAnswers = false;
  if (req.user?.role_name === 'admin') {
    canSeeAnswers = true;
  } else if (req.user?.role_name === 'lecturer') {
    const course = await coursesRepo.findById(req.params.courseId);
    canSeeAnswers = !!course && course.lecturer_id === req.user.id;
  }

  return ApiResponse.success(res, canSeeAnswers ? data : data.map(stripAnswers));
});

const getAssignmentById = asyncHandler(async (req, res) => {
  const assignment = await assignRepo.findAssignmentById(req.params.id);
  if (!assignment) return ApiResponse.notFound(res);

  if (req.user?.role_name === 'student') {
    await ensureStudentCanAccessAssignment(req.user.id, assignment, 'xem bài tập này');
    return ApiResponse.success(res, stripAnswers(assignment));
  }

  return ApiResponse.success(res, assignment);
});

const createAssignment = asyncHandler(async (req, res) => {
  const course = await coursesRepo.findById(req.body.course_id);
  if (!course) return ApiResponse.notFound(res, 'Khóa học không tồn tại');
  if (req.user.role_name === 'lecturer' && course.lecturer_id !== req.user.id) {
    return ApiResponse.forbidden(res, 'Bạn không có quyền tạo bài tập cho khóa học này');
  }

  const payload = normalizeAssignmentPayload(req.body);
  const id = await assignRepo.createAssignment(payload);
  if (payload.is_final_test) await assignRepo.clearFinalTestExcept(req.body.course_id, id);
  const data = await assignRepo.findAssignmentById(id);
  return ApiResponse.created(res, data, 'Tạo bài tập thành công');
});

const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await assignRepo.findAssignmentById(req.params.id);
  if (!assignment) return ApiResponse.notFound(res);
  if (!(await ensureLecturerOwnsAssignment(req, res, assignment))) return;

  const payload = normalizeAssignmentPayload({ ...assignment, ...req.body });
  await assignRepo.updateAssignment(req.params.id, payload);
  if (payload.is_final_test) await assignRepo.clearFinalTestExcept(assignment.course_id, Number(req.params.id));
  const data = await assignRepo.findAssignmentById(req.params.id);
  return ApiResponse.success(res, data, 'Cập nhật bài tập thành công');
});

const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await assignRepo.findAssignmentById(req.params.id);
  if (!assignment) return ApiResponse.notFound(res);
  if (!(await ensureLecturerOwnsAssignment(req, res, assignment))) return;
  await assignRepo.removeAssignment(req.params.id);
  return ApiResponse.success(res, null, 'Xóa bài tập thành công');
});

// ---- Submissions ----
const submitAssignment = asyncHandler(async (req, res) => {
  const assignment = await assignRepo.findAssignmentById(req.body.assignment_id);
  if (!assignment) return ApiResponse.notFound(res, 'Bài tập không tồn tại');

  await ensureStudentCanAccessAssignment(req.user.id, assignment, 'nộp bài');

  const existing = await subRepo.findByStudentAndAssignment(req.user.id, req.body.assignment_id);
  if (existing) return ApiResponse.error(res, 'Bạn đã nộp bài này rồi', 400);

  const questions = normalizeQuestions(assignment);
  // Khi hết giờ tự nộp (auto_submit) thì cho phép nộp dù còn câu trống (câu trống tính 0 điểm).
  if (assignment.auto_grade && questions.length > 0 && !req.body.auto_submit) {
    const answers = req.body.answers || {};
    const unansweredIndex = questions.findIndex((question, index) => {
      const answer = answers[question.id] ?? answers[index];
      return answer === undefined || answer === null || String(answer).trim() === '';
    });

    if (unansweredIndex >= 0) {
      return ApiResponse.error(res, `Bạn cần trả lời câu ${unansweredIndex + 1} trước khi nộp bài.`, 400);
    }
  }

  const id = await subRepo.create({ ...req.body, student_id: req.user.id });
  let result = null;
  let report = null;

  if (assignment.auto_grade && questions.length > 0) {
    const grading = gradeAssignment(assignment, req.body.answers || {});
    if (grading) {
      await resultRepo.create({ submission_id: id, score: grading.score, feedback: grading.feedback });
      result = await resultRepo.findBySubmission(id);
      report = grading.report || null;
    }
  }

  const submission = await subRepo.findById(id);
  return ApiResponse.created(res, { submission, result, report }, 'Nộp bài thành công');
});

const getSubmissionsByAssignment = asyncHandler(async (req, res) => {
  const assignment = await assignRepo.findAssignmentById(req.params.assignmentId);
  if (!assignment) return ApiResponse.notFound(res, 'Bài tập không tồn tại');
  if (!(await ensureLecturerOwnsAssignment(req, res, assignment))) return;
  const data = await subRepo.findByAssignment(req.params.assignmentId);
  return ApiResponse.success(res, data);
});

const getMySubmissions = asyncHandler(async (req, res) => {
  const data = await subRepo.findByStudent(req.user.id);
  return ApiResponse.success(res, data);
});

// ---- Results / Grading ----
const gradeSubmission = asyncHandler(async (req, res) => {
  const sub = await subRepo.findById(req.body.submission_id);
  if (!sub) return ApiResponse.notFound(res, 'Bài nộp không tồn tại');
  const assignment = await assignRepo.findAssignmentById(sub.assignment_id);
  if (!assignment) return ApiResponse.notFound(res, 'Bài tập không tồn tại');
  if (!(await ensureLecturerOwnsAssignment(req, res, assignment))) return;
  const existing = await resultRepo.findBySubmission(req.body.submission_id);
  if (existing) {
    await resultRepo.update(req.body.submission_id, req.body);
  } else {
    await resultRepo.create(req.body);
  }
  const result = await resultRepo.findBySubmission(req.body.submission_id);
  return ApiResponse.success(res, result, 'Chấm điểm thành công');
});

module.exports = {
  getAssignmentsByCourse,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getSubmissionsByAssignment,
  getMySubmissions,
  gradeSubmission,
};
