const usersRepo = require('../repositories/users.repository');
const coursesRepo = require('../repositories/courses.repository');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// GET /lecturers — danh sach giang vien co khoa hoc (khu "Nguoi Truyen Lua"), cong khai
const getPublicLecturers = asyncHandler(async (req, res) => {
  const lecturers = await usersRepo.findLecturersWithPublishedCourses();
  return ApiResponse.success(res, lecturers);
});

// GET /lecturers/:id — ho so + khoa hoc cua giang vien, cong khai
const getPublicLecturer = asyncHandler(async (req, res) => {
  const lecturer = await usersRepo.findLecturerPublic(req.params.id);
  if (!lecturer) return ApiResponse.notFound(res, 'Không tìm thấy giáo viên');

  const { rows: courses } = await coursesRepo.findAll(100, 0, {
    lecturer_id: req.params.id,
    status: 'published',
  });

  return ApiResponse.success(res, {
    ...lecturer,
    course_count: courses.length,
    courses,
  });
});

// GET /lecturers/me/profile — ho so cua chinh giang vien dang dang nhap
const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await usersRepo.findById(req.user.id);
  return ApiResponse.success(res, profile);
});

// PUT /lecturers/me/profile — cap nhat headline/bio/avatar
const updateMyProfile = asyncHandler(async (req, res) => {
  const data = {};
  if (req.body.full_name !== undefined) {
    const fullName = String(req.body.full_name).trim();
    if (fullName) data.full_name = fullName;
  }
  if (req.body.headline !== undefined) data.headline = String(req.body.headline).trim().slice(0, 160) || null;
  if (req.body.bio !== undefined) data.bio = String(req.body.bio).trim() || null;
  if (req.file) data.avatar_url = `/uploads/avatars/${req.file.filename}`;

  await usersRepo.update(req.user.id, data);
  const profile = await usersRepo.findById(req.user.id);
  return ApiResponse.success(res, profile, 'Cập nhật hồ sơ thành công');
});

module.exports = { getPublicLecturers, getPublicLecturer, getMyProfile, updateMyProfile };
