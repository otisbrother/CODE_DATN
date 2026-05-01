const enrollService = require('../services/enrollments.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const enroll = asyncHandler(async (req, res) => {
  const result = await enrollService.enroll(req.user.id, req.body.course_id, req.body.payment_method);
  const statusCode = result.status === 'active' ? 201 : 200;
  const message = result.status === 'active'
    ? 'Đăng ký khóa học thành công!'
    : 'Vui lòng thanh toán để mở khóa khóa học';
  return res.status(statusCode).json({ success: true, data: result, message });
});

const getMyEnrollments = asyncHandler(async (req, res) => {
  const data = await enrollService.getMyEnrollments(req.user.id);
  return ApiResponse.success(res, data);
});

const getCourseEnrollments = asyncHandler(async (req, res) => {
  const data = await enrollService.getCourseEnrollments(req.params.courseId);
  return ApiResponse.success(res, data);
});

const checkEnrollment = asyncHandler(async (req, res) => {
  const data = await enrollService.checkEnrollment(req.user.id, req.params.courseId);
  return ApiResponse.success(res, data);
});

module.exports = { enroll, getMyEnrollments, getCourseEnrollments, checkEnrollment };
