const coursesRepo = require('../repositories/courses.repository');

const getAll = async (page, limit, filters) => {
  const offset = (page - 1) * limit;
  return await coursesRepo.findAll(limit, offset, filters);
};

const getById = async (id) => {
  const course = await coursesRepo.findById(id);
  if (!course) { const e = new Error('Khóa học không tồn tại'); e.statusCode = 404; throw e; }
  return course;
};

const create = async (data) => {
  const id = await coursesRepo.create(data);
  return await coursesRepo.findById(id);
};

const update = async (id, data, userId, userRole) => {
  const course = await getById(id);
  if (userRole === 'lecturer' && course.lecturer_id !== userId) {
    const e = new Error('Bạn chỉ được chỉnh sửa khóa học của mình'); e.statusCode = 403; throw e;
  }
  await coursesRepo.update(id, data);
  return await coursesRepo.findById(id);
};

const remove = async (id, userId, userRole) => {
  const course = await getById(id);
  if (userRole === 'lecturer' && course.lecturer_id !== userId) {
    const e = new Error('Bạn chỉ được xóa khóa học của mình'); e.statusCode = 403; throw e;
  }
  await coursesRepo.remove(id);
};

module.exports = { getAll, getById, create, update, remove };
