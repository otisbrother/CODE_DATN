const vouchersService = require('../services/vouchers.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getAll = asyncHandler(async (req, res) => {
  const data = await vouchersService.getAll({
    status: req.query.status,
    mode: req.query.mode,
    search: req.query.search,
  });
  return ApiResponse.success(res, data);
});

const getPublicPromotions = asyncHandler(async (req, res) => {
  const data = await vouchersService.getPublicPromotions(req.query.limit);
  return ApiResponse.success(res, data);
});

const getPublicPromotionById = asyncHandler(async (req, res) => {
  const data = await vouchersService.getPublicPromotionById(req.params.id);
  return ApiResponse.success(res, data);
});

const getById = asyncHandler(async (req, res) => {
  const data = await vouchersService.getById(req.params.id);
  return ApiResponse.success(res, data);
});

const create = asyncHandler(async (req, res) => {
  const data = await vouchersService.create(req.body, req.user.id);
  return ApiResponse.created(res, data, 'Tao voucher thanh cong');
});

const update = asyncHandler(async (req, res) => {
  const data = await vouchersService.update(req.params.id, req.body);
  return ApiResponse.success(res, data, 'Cap nhat voucher thanh cong');
});

const remove = asyncHandler(async (req, res) => {
  await vouchersService.remove(req.params.id);
  return ApiResponse.success(res, null, 'Da tat voucher');
});

const previewForCourse = asyncHandler(async (req, res) => {
  const data = await vouchersService.previewForCourse(req.user.id, req.params.courseId, req.query.code);
  return ApiResponse.success(res, data);
});

module.exports = { getAll, getPublicPromotions, getPublicPromotionById, getById, create, update, remove, previewForCourse };
