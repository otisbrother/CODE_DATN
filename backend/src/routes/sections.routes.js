const express = require('express');
const router = express.Router();
const sectionsController = require('../controllers/sections.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// Public: list sections by course
router.get('/course/:courseId', sectionsController.getByCourse);
router.get('/:id', sectionsController.getById);

// Lecturer/Admin: CRUD
router.post('/', authMiddleware, roleMiddleware('lecturer', 'admin'), sectionsController.create);
router.put('/:id', authMiddleware, roleMiddleware('lecturer', 'admin'), sectionsController.update);
router.delete('/:id', authMiddleware, roleMiddleware('lecturer', 'admin'), sectionsController.remove);

module.exports = router;
