const reviewsService = require('../services/reviews.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// GET /courses/:id/reviews — Public hoặc Admin
const getReviews = asyncHandler(async (req, res) => {
  const reviews = await reviewsService.getReviewsByCourse(req.params.id);
  const rating = await reviewsService.getCourseRating(req.params.id);
  return ApiResponse.success(res, { reviews, ...rating });
});

// POST /courses/:id/reviews — Student (đã hoàn thành 100%)
const createReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return ApiResponse.error(res, 'Rating phải từ 1 đến 5', 400);
  }
  try {
    const result = await reviewsService.createReview(req.user.id, Number(req.params.id), Number(rating), comment);
    const message = result.updated ? 'Cập nhật đánh giá thành công' : 'Gửi đánh giá thành công';
    return ApiResponse.success(res, result, message);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return ApiResponse.error(res, err.message, statusCode);
  }
});

// GET /courses/:id/reviews/check — Student kiểm tra quyền review
const checkCanReview = asyncHandler(async (req, res) => {
  const result = await reviewsService.canReview(req.user.id, Number(req.params.id));
  return ApiResponse.success(res, result);
});

// GET /courses/trending — Public
const getTrending = asyncHandler(async (req, res) => {
  const courses = await reviewsService.getTrendingCourses();
  return ApiResponse.success(res, courses);
});

// GET /courses/with-ratings — Public (for homepage)
const getWithRatings = asyncHandler(async (req, res) => {
  const courses = await reviewsService.getCoursesWithRatings();
  return ApiResponse.success(res, courses);
});

// GET /reviews/feedback — Phản hồi <=2 sao (lecturer: khóa của mình, admin: tất cả)
const getFeedback = asyncHandler(async (req, res) => {
  const lecturerId = req.user.role_name === 'lecturer' ? req.user.id : undefined;
  const feedback = await reviewsService.getLowRatingFeedback({ lecturerId });
  return ApiResponse.success(res, feedback);
});

module.exports = { getReviews, createReview, checkCanReview, getTrending, getWithRatings, getFeedback };
