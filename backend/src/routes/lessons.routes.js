const express = require('express');
const router = express.Router();
const lessonsController = require('../controllers/lessons.controller');
const materialsController = require('../controllers/materials.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const { uploadMaterial, uploadLessonVideo } = require('../middlewares/upload.middleware');

// Lessons
router.get('/course/:courseId', lessonsController.getByCourse);
router.get('/:id', lessonsController.getById);
router.post('/', authMiddleware, roleMiddleware('lecturer', 'admin'),
  uploadLessonVideo.single('video'),
  lessonsController.create
);
router.put('/:id', authMiddleware, roleMiddleware('lecturer', 'admin'),
  uploadLessonVideo.single('video'),
  lessonsController.update
);
router.delete('/:id', authMiddleware, roleMiddleware('lecturer', 'admin'), lessonsController.remove);

// Materials
router.get('/:lessonId/materials', materialsController.getByLesson);
router.post('/:lessonId/materials', authMiddleware, roleMiddleware('lecturer', 'admin'), uploadMaterial.single('file'), materialsController.upload);
router.delete('/materials/:id', authMiddleware, roleMiddleware('lecturer', 'admin'), materialsController.remove);

module.exports = router;
