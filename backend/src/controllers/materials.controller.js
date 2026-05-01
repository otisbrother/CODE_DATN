const materialsRepo = require('../repositories/materials.repository');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getByLesson = asyncHandler(async (req, res) => {
  const data = await materialsRepo.findByLesson(req.params.lessonId);
  return ApiResponse.success(res, data);
});

const upload = asyncHandler(async (req, res) => {
  if (!req.file) {
    return ApiResponse.error(res, 'Vui lòng chọn file để tải lên', 400);
  }
  const material = await materialsRepo.create({
    lesson_id: req.params.lessonId,
    file_name: req.file.originalname,
    file_type: req.file.mimetype,
    material_type: req.body.material_type || 'document',
    file_url: `/uploads/materials/${req.file.filename}`,
    sort_order: req.body.sort_order || 1,
  });
  const data = await materialsRepo.findById(material);
  return ApiResponse.created(res, data, 'Tải tài liệu lên thành công');
});

const remove = asyncHandler(async (req, res) => {
  const material = await materialsRepo.findById(req.params.id);
  if (!material) return ApiResponse.notFound(res, 'Tài liệu không tồn tại');
  await materialsRepo.remove(req.params.id);
  return ApiResponse.success(res, null, 'Xóa tài liệu thành công');
});

module.exports = { getByLesson, upload, remove };
