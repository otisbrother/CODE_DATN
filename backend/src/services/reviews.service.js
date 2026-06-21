const reviewsRepo = require('../repositories/reviews.repository');
const progressRepo = require('../repositories/progress.repository');

const MIN_TRENDING_RATING = 4.0;
const PUBLIC_MIN_RATING = 3; // chỉ đánh giá >= 3 sao mới hiển thị công khai

// Comment mặc định theo số sao (3-5). <=2 sao bắt buộc nhập tự do.
const DEFAULT_COMMENTS = {
  5: 'Khóa học rất hay',
  4: 'Khóa học hay',
  3: 'Khóa học ổn',
};

const resolveComment = (rating, comment) => {
  const text = String(comment || '').trim();
  if (rating >= PUBLIC_MIN_RATING) {
    // 3-5 sao: nếu không nhập thì dùng comment mặc định
    return text || DEFAULT_COMMENTS[rating] || 'Khóa học ổn';
  }
  // <=2 sao: bắt buộc nhập lý do (gửi giáo viên + admin)
  if (!text) {
    throw Object.assign(new Error('Đánh giá từ 2 sao trở xuống cần nhập lý do/góp ý để gửi giáo viên'), { statusCode: 400 });
  }
  return text;
};

const getReviewsByCourse = async (courseId) => {
  // Công khai: chỉ trả review >= 3 sao
  return reviewsRepo.findByCourse(courseId, { minRating: PUBLIC_MIN_RATING });
};

const createReview = async (studentId, courseId, rating, comment) => {
  // Kiểm tra đã hoàn thành khóa học chưa (completion_rate = 100)
  const progress = await progressRepo.findByStudentAndCourse(studentId, courseId);
  if (!progress || progress.completion_rate < 100) {
    throw Object.assign(new Error('Bạn cần hoàn thành 100% khóa học trước khi đánh giá'), { statusCode: 403 });
  }

  const finalComment = resolveComment(rating, comment);
  const isPublic = rating >= PUBLIC_MIN_RATING;

  // Kiểm tra đã review chưa
  const existing = await reviewsRepo.findByStudentAndCourse(studentId, courseId);
  if (existing) {
    await reviewsRepo.update(existing.id, { rating, comment: finalComment });
    return { ...existing, rating, comment: finalComment, is_public: isPublic, updated: true };
  }

  const id = await reviewsRepo.create({ course_id: courseId, student_id: studentId, rating, comment: finalComment });
  return { id, course_id: courseId, student_id: studentId, rating, comment: finalComment, is_public: isPublic, created: true };
};

// Phản hồi tiêu cực (<=2 sao) cho giáo viên/admin
const getLowRatingFeedback = async ({ lecturerId } = {}) => {
  return reviewsRepo.findLowRatingFeedback({ maxRating: PUBLIC_MIN_RATING - 1, lecturerId });
};

const getCourseRating = async (courseId) => {
  return reviewsRepo.getAvgRating(courseId);
};

const getTrendingCourses = async () => {
  const courses = await reviewsRepo.getCoursesWithRating();
  return courses.filter((c) => Number(c.avg_rating) >= MIN_TRENDING_RATING && c.review_count > 0);
};

const getCoursesWithRatings = async () => {
  return reviewsRepo.getCoursesWithRating();
};

const canReview = async (studentId, courseId) => {
  const progress = await progressRepo.findByStudentAndCourse(studentId, courseId);
  const completed = progress && progress.completion_rate >= 100;
  const existing = await reviewsRepo.findByStudentAndCourse(studentId, courseId);
  return { can_review: completed, already_reviewed: !!existing, existing_review: existing };
};

module.exports = {
  getReviewsByCourse,
  createReview,
  getCourseRating,
  getTrendingCourses,
  getCoursesWithRatings,
  canReview,
  getLowRatingFeedback,
};
