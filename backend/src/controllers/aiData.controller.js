const aiDataRepo = require('../repositories/aiData.repository');
const db = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const ensureCourseDataAccess = async (req, res, courseId) => {
  const [[course]] = await db.query(
    `SELECT id, lecturer_id FROM courses WHERE id = ?`,
    [courseId]
  );

  if (!course) {
    ApiResponse.notFound(res, 'Khóa học không tồn tại');
    return false;
  }

  if (req.user.role_name === 'lecturer' && Number(course.lecturer_id) !== Number(req.user.id)) {
    ApiResponse.forbidden(res, 'Bạn chỉ được quản lý dữ liệu AI của khóa học mình phụ trách');
    return false;
  }

  return true;
};

const getAll = asyncHandler(async (req, res) => {
  const data = await aiDataRepo.findAll(req.query.status);
  return ApiResponse.success(res, data);
});

const getByCourse = asyncHandler(async (req, res) => {
  const canAccess = await ensureCourseDataAccess(req, res, req.params.courseId);
  if (!canAccess) return;
  const data = await aiDataRepo.findByCourse(req.params.courseId);
  return ApiResponse.success(res, data);
});

const create = asyncHandler(async (req, res) => {
  const canAccess = await ensureCourseDataAccess(req, res, req.body.course_id);
  if (!canAccess) return;

  // Giáo viên tự quản lý dữ liệu AI của khóa mình -> dùng được ngay (không cần duyệt)
  const data = {
    course_id: req.body.course_id,
    uploaded_by: req.user.id,
    file_name: req.body.file_name || (req.file ? req.file.originalname : 'text_input'),
    file_type: req.body.file_type || (req.file ? req.file.mimetype : 'text'),
    file_url: req.file ? `/uploads/ai-data/${req.file.filename}` : '',
    content: req.body.content || null,
    status: 'approved',
    approved_by: req.user.id,
    approved_at: new Date(),
  };
  const id = await aiDataRepo.create(data);
  const record = await aiDataRepo.findById(id);
  return ApiResponse.created(res, record, 'Lưu dữ liệu AI thành công');
});

const update = asyncHandler(async (req, res) => {
  const record = await aiDataRepo.findById(req.params.id);
  if (!record) return ApiResponse.notFound(res, 'Dữ liệu AI không tồn tại');

  const canAccess = await ensureCourseDataAccess(req, res, record.course_id);
  if (!canAccess) return;

  // Giáo viên sửa -> vẫn dùng được ngay (không cần duyệt lại)
  const data = {
    file_name: req.body.file_name || record.file_name,
    file_type: req.body.file_type || record.file_type,
    content: req.body.content !== undefined ? req.body.content : record.content,
    status: 'approved',
    approved_by: req.user.id,
    approved_at: new Date(),
  };

  if (req.file) {
    data.file_name = req.body.file_name || req.file.originalname;
    data.file_type = req.body.file_type || req.file.mimetype;
    data.file_url = `/uploads/ai-data/${req.file.filename}`;
  }

  await aiDataRepo.update(req.params.id, data);
  const updated = await aiDataRepo.findById(req.params.id);
  return ApiResponse.success(res, updated, 'Cập nhật dữ liệu AI thành công');
});

const remove = asyncHandler(async (req, res) => {
  const record = await aiDataRepo.findById(req.params.id);
  if (!record) return ApiResponse.notFound(res, 'Dữ liệu AI không tồn tại');

  const canAccess = await ensureCourseDataAccess(req, res, record.course_id);
  if (!canAccess) return;

  await aiDataRepo.remove(req.params.id);
  return ApiResponse.success(res, null, 'Xóa dữ liệu AI thành công');
});


module.exports = { getAll, getByCourse, create, update, remove };
  
