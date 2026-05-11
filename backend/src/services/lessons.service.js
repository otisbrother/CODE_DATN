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
  const courseId = Number(data.course_id);
  const sectionId = Number(data.section_id);
  const lessonData = { ...data, course_id: courseId, section_id: sectionId };

  const course = await coursesRepo.findById(courseId);
  if (!course) { const e = new Error('Khóa học không tồn tại'); e.statusCode = 404; throw e; }
  if (userRole === 'lecturer' && course.lecturer_id !== userId) {
    const e = new Error('Bạn không có quyền thêm bài học cho khóa học này'); e.statusCode = 403; throw e;
  }
  // Validate section belongs to course
  if (sectionId) {
    const section = await sectionsRepo.findById(sectionId);
    if (!section || Number(section.course_id) !== courseId) {
      const e = new Error('Chương không thuộc khóa học này'); e.statusCode = 400; throw e;
    }
  }
  const id = await lessonsRepo.create(lessonData);
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
    const sectionId = Number(data.section_id);
    const section = await sectionsRepo.findById(sectionId);
    if (!section || Number(section.course_id) !== Number(lesson.course_id)) {
      const e = new Error('Chương không thuộc khóa học này'); e.statusCode = 400; throw e;
    }
    data.section_id = sectionId;
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
