const coursesService = require('../services/courses.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, getPaginationMeta } = require('../utils/pagination');

const getAll = asyncHandler(async (req, res) => {
  const { page, limit } = getPagination(req.query);
  const filters = { status: req.query.status, lecturer_id: req.query.lecturer_id, search: req.query.search };
  const { rows, total } = await coursesService.getAll(page, limit, filters);
  return ApiResponse.paginated(res, rows, getPaginationMeta(total, page, limit));
});

const getById = asyncHandler(async (req, res) => {
  const course = await coursesService.getById(req.params.id);
  return ApiResponse.success(res, course);
});

const create = asyncHandler(async (req, res) => {
  const data = { ...req.body, lecturer_id: req.user.id };
  const course = await coursesService.create(data);
  return ApiResponse.created(res, course, 'Tạo khóa học thành công');
});

const update = asyncHandler(async (req, res) => {
  const course = await coursesService.update(req.params.id, req.body, req.user.id, req.user.role_name);
  return ApiResponse.success(res, course, 'Cập nhật khóa học thành công');
});

const remove = asyncHandler(async (req, res) => {
  await coursesService.remove(req.params.id, req.user.id, req.user.role_name);
  return ApiResponse.success(res, null, 'Xóa khóa học thành công');
});

module.exports = { getAll, getById, create, update, remove };
