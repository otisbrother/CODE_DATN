const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/assignments.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// Assignments CRUD
router.get('/course/:courseId', ctrl.getAssignmentsByCourse);
router.get('/:id', ctrl.getAssignmentById);
router.post('/', authMiddleware, roleMiddleware('lecturer', 'admin'), ctrl.createAssignment);
router.put('/:id', authMiddleware, roleMiddleware('lecturer', 'admin'), ctrl.updateAssignment);
router.delete('/:id', authMiddleware, roleMiddleware('lecturer', 'admin'), ctrl.deleteAssignment);

// Submissions
router.post('/submit', authMiddleware, roleMiddleware('student'), ctrl.submitAssignment);
router.get('/submissions/my', authMiddleware, roleMiddleware('student'), ctrl.getMySubmissions);
router.get('/submissions/assignment/:assignmentId', authMiddleware, roleMiddleware('lecturer', 'admin'), ctrl.getSubmissionsByAssignment);

// Results / Grading
router.post('/grade', authMiddleware, roleMiddleware('lecturer', 'admin'), ctrl.gradeSubmission);

module.exports = router;
