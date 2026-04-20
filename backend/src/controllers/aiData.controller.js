const aiDataRepo = require('../repositories/aiData.repository');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getAll = asyncHandler(async (req, res) => {
  const data = await aiDataRepo.findAll(req.query.status);
  return ApiResponse.success(res, data);
});

const getByCourse = asyncHandler(async (req, res) => {
  const data = await aiDataRepo.findByCourse(req.params.courseId);
  return ApiResponse.success(res, data);
});

const create = asyncHandler(async (req, res) => {
  const data = {
    course_id: req.body.course_id,
    uploaded_by: req.user.id,
    file_name: req.body.file_name || (req.file ? req.file.originalname : 'text_input'),
    file_type: req.body.file_type || (req.file ? req.file.mimetype : 'text'),
    file_url: req.file ? `/uploads/ai-data/${req.file.filename}` : '',
    content: req.body.content || null,
  };
  const id = await aiDataRepo.create(data);
  const record = await aiDataRepo.findById(id);
  return ApiResponse.created(res, record, 'Gửi dữ liệu AI thành công, đang chờ duyệt');
});

const approve = asyncHandler(async (req, res) => {
  const record = await aiDataRepo.findById(req.params.id);
  if (!record) return ApiResponse.notFound(res, 'Dữ liệu AI không tồn tại');
  await aiDataRepo.updateStatus(req.params.id, 'approved', req.user.id);
  return ApiResponse.success(res, null, 'Duyệt dữ liệu AI thành công');
});

const reject = asyncHandler(async (req, res) => {
  const record = await aiDataRepo.findById(req.params.id);
  if (!record) return ApiResponse.notFound(res, 'Dữ liệu AI không tồn tại');
  await aiDataRepo.updateStatus(req.params.id, 'rejected', req.user.id);
  return ApiResponse.success(res, null, 'Từ chối dữ liệu AI thành công');
});

module.exports = { getAll, getByCourse, create, approve, reject };
