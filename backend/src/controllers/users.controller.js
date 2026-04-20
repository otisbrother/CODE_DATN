const usersService = require('../services/users.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, getPaginationMeta } = require('../utils/pagination');

const getAll = asyncHandler(async (req, res) => {
  const { page, limit } = getPagination(req.query);
  const filters = { search: req.query.search, role: req.query.role };
  const { rows, total } = await usersService.getAll(page, limit, filters);
  return ApiResponse.paginated(res, rows, getPaginationMeta(total, page, limit));
});

const getById = asyncHandler(async (req, res) => {
  const user = await usersService.getById(req.params.id);
  return ApiResponse.success(res, user);
});

const update = asyncHandler(async (req, res) => {
  const user = await usersService.update(req.params.id, req.body);
  return ApiResponse.success(res, user, 'Cập nhật người dùng thành công');
});

const remove = asyncHandler(async (req, res) => {
  await usersService.remove(req.params.id);
  return ApiResponse.success(res, null, 'Khóa tài khoản thành công');
});

module.exports = { getAll, getById, update, remove };
