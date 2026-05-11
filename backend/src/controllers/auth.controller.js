const authService = require('../services/auth.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  return ApiResponse.created(res, result, 'Dang ky thanh cong');
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  return ApiResponse.success(res, result, 'Dang nhap thanh cong');
});

const googleLogin = asyncHandler(async (req, res) => {
  const result = await authService.googleLogin(req.body);
  return ApiResponse.success(res, result, 'Dang nhap Gmail thanh cong');
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  return ApiResponse.success(res, user);
});

module.exports = { register, login, googleLogin, getProfile };
