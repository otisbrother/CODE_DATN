const express = require('express');
const router = express.Router();
const coursesController = require('../controllers/courses.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// Public: list published courses
router.get('/', coursesController.getAll);
router.get('/:id', coursesController.getById);

// Lecturer/Admin: CRUD
router.post('/', authMiddleware, roleMiddleware('lecturer', 'admin'), coursesController.create);
router.put('/:id', authMiddleware, roleMiddleware('lecturer', 'admin'), coursesController.update);
router.delete('/:id', authMiddleware, roleMiddleware('lecturer', 'admin'), coursesController.remove);

module.exports = router;
