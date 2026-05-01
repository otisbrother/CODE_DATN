const lessonsRepo = require('../repositories/lessons.repository');
const coursesRepo = require('../repositories/courses.repository');
const sectionsRepo = require('../repositories/sections.repository');

const getByCourse = async (courseId) => {
  return await lessonsRepo.findByCourse(courseId);
};

const getById = async (id) => {
  const lesson = await lessonsRepo.findById(id);
  if (!lesson) { const e = new Error('Bài học không tồn tại'); e.statusCode = 404; throw e; }
  return lesson;
};

const create = async (data, userId, userRole) => {
  const course = await coursesRepo.findById(data.course_id);
  if (!course) { const e = new Error('Khóa học không tồn tại'); e.statusCode = 404; throw e; }
  if (userRole === 'lecturer' && course.lecturer_id !== userId) {
    const e = new Error('Bạn không có quyền thêm bài học cho khóa học này'); e.statusCode = 403; throw e;
  }
  // Validate section belongs to course
  if (data.section_id) {
    const section = await sectionsRepo.findById(data.section_id);
    if (!section || section.course_id !== data.course_id) {
      const e = new Error('Chương không thuộc khóa học này'); e.statusCode = 400; throw e;
    }
  }
  const id = await lessonsRepo.create(data);
  return await lessonsRepo.findById(id);
};

const update = async (id, data, userId, userRole) => {
  const lesson = await getById(id);
  const course = await coursesRepo.findById(lesson.course_id);
  if (userRole === 'lecturer' && course.lecturer_id !== userId) {
    const e = new Error('Bạn không có quyền chỉnh sửa bài học này'); e.statusCode = 403; throw e;
  }
  // Validate section belongs to course if changing section
  if (data.section_id) {
    const section = await sectionsRepo.findById(data.section_id);
    if (!section || section.course_id !== lesson.course_id) {
      const e = new Error('Chương không thuộc khóa học này'); e.statusCode = 400; throw e;
    }
  }
  await lessonsRepo.update(id, data);
  return await lessonsRepo.findById(id);
};

const remove = async (id, userId, userRole) => {
  const lesson = await getById(id);
  const course = await coursesRepo.findById(lesson.course_id);
  if (userRole === 'lecturer' && course.lecturer_id !== userId) {
    const e = new Error('Bạn không có quyền xóa bài học này'); e.statusCode = 403; throw e;
  }
  await lessonsRepo.remove(id);
};

module.exports = { getByCourse, getById, create, update, remove };
