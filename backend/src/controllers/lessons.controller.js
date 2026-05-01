const lessonsService = require('../services/lessons.service');
const materialsRepo = require('../repositories/materials.repository');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getByCourse = asyncHandler(async (req, res) => {
  const data = await lessonsService.getByCourse(req.params.courseId);
  return ApiResponse.success(res, data);
});

const getById = asyncHandler(async (req, res) => {
  const lesson = await lessonsService.getById(req.params.id);
  const materials = await materialsRepo.findByLesson(req.params.id);
  return ApiResponse.success(res, { ...lesson, materials });
});

const create = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  // Handle video file upload
  if (req.file) {
    data.video_url = `/uploads/videos/${req.file.filename}`;
  }
  const lesson = await lessonsService.create(data, req.user.id, req.user.role_name);
  return ApiResponse.created(res, lesson, 'Tạo bài học thành công');
});

const update = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  // Handle video file upload
  if (req.file) {
    data.video_url = `/uploads/videos/${req.file.filename}`;
  }
  const lesson = await lessonsService.update(req.params.id, data, req.user.id, req.user.role_name);
  return ApiResponse.success(res, lesson, 'Cập nhật bài học thành công');
});

const remove = asyncHandler(async (req, res) => {
  await lessonsService.remove(req.params.id, req.user.id, req.user.role_name);
  return ApiResponse.success(res, null, 'Xóa bài học thành công');
});

module.exports = { getByCourse, getById, create, update, remove };
