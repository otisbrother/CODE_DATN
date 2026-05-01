const express = require('express');
const router = express.Router();
const coursesController = require('../controllers/courses.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const { uploadCourse } = require('../middlewares/upload.middleware');

// Public: list published courses
router.get('/', coursesController.getAll);
router.get('/:id', coursesController.getById);

// Lecturer/Admin: CRUD (with file upload for thumbnail + intro_video)
router.post('/', authMiddleware, roleMiddleware('lecturer', 'admin'),
  uploadCourse.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'intro_video', maxCount: 1 }]),
  coursesController.create
);
router.put('/:id', authMiddleware, roleMiddleware('lecturer', 'admin'),
  uploadCourse.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'intro_video', maxCount: 1 }]),
  coursesController.update
);
router.delete('/:id', authMiddleware, roleMiddleware('lecturer', 'admin'), coursesController.remove);

module.exports = router;
