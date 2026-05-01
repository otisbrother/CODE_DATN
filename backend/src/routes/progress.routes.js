const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/progress.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

router.use(authMiddleware);
router.get('/my', roleMiddleware('student'), ctrl.getMyProgress);
router.get('/course/:courseId', roleMiddleware('lecturer', 'admin'), ctrl.getCourseProgress);
router.post('/complete-lesson', roleMiddleware('student'), ctrl.completeLesson);
router.post('/recalculate', roleMiddleware('student'), ctrl.recalculate);
router.get('/all', roleMiddleware('admin'), ctrl.getAllProgress);

module.exports = router;
