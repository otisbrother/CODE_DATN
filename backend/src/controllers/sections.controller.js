const sectionsRepo = require('../repositories/sections.repository');
const coursesRepo = require('../repositories/courses.repository');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getByCourse = asyncHandler(async (req, res) => {
  const data = await sectionsRepo.findByCourse(req.params.courseId);
  return ApiResponse.success(res, data);
});

const getById = asyncHandler(async (req, res) => {
  const section = await sectionsRepo.findById(req.params.id);
  if (!section) return ApiResponse.notFound(res, 'Chương không tồn tại');
  return ApiResponse.success(res, section);
});

const create = asyncHandler(async (req, res) => {
  const course = await coursesRepo.findById(req.body.course_id);
  if (!course) return ApiResponse.notFound(res, 'Khóa học không tồn tại');
  if (req.user.role_name === 'lecturer' && course.lecturer_id !== req.user.id) {
    return ApiResponse.forbidden(res, 'Bạn không có quyền thêm chương cho khóa học này');
  }
  const id = await sectionsRepo.create(req.body);
  const data = await sectionsRepo.findById(id);
  return ApiResponse.created(res, data, 'Tạo chương thành công');
});

const update = asyncHandler(async (req, res) => {
  const section = await sectionsRepo.findById(req.params.id);
  if (!section) return ApiResponse.notFound(res, 'Chương không tồn tại');
  const course = await coursesRepo.findById(section.course_id);
  if (req.user.role_name === 'lecturer' && course.lecturer_id !== req.user.id) {
    return ApiResponse.forbidden(res, 'Bạn không có quyền chỉnh sửa chương này');
  }
  await sectionsRepo.update(req.params.id, req.body);
  const data = await sectionsRepo.findById(req.params.id);
  return ApiResponse.success(res, data, 'Cập nhật chương thành công');
});

const remove = asyncHandler(async (req, res) => {
  const section = await sectionsRepo.findById(req.params.id);
  if (!section) return ApiResponse.notFound(res, 'Chương không tồn tại');
  const course = await coursesRepo.findById(section.course_id);
  if (req.user.role_name === 'lecturer' && course.lecturer_id !== req.user.id) {
    return ApiResponse.forbidden(res, 'Bạn không có quyền xóa chương này');
  }
  await sectionsRepo.remove(req.params.id);
  return ApiResponse.success(res, null, 'Xóa chương thành công');
});

module.exports = { getByCourse, getById, create, update, remove };
