const express = require('express');
const router = express.Router();
const enrollController = require('../controllers/enrollments.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

router.use(authMiddleware);
router.post('/', roleMiddleware('student'), enrollController.enroll);
router.get('/my', roleMiddleware('student'), enrollController.getMyEnrollments);
router.get('/check/:courseId', roleMiddleware('student'), enrollController.checkEnrollment);
router.get('/course/:courseId', roleMiddleware('lecturer', 'admin'), enrollController.getCourseEnrollments);

module.exports = router;
