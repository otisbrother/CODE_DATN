const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');
const coursesRoutes = require('./courses.routes');
const enrollmentsRoutes = require('./enrollments.routes');
const lessonsRoutes = require('./lessons.routes');
const assignmentsRoutes = require('./assignments.routes');
const progressRoutes = require('./progress.routes');
const aiRoutes = require('./ai.routes');

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/courses', coursesRoutes);
router.use('/enrollments', enrollmentsRoutes);
router.use('/lessons', lessonsRoutes);
router.use('/assignments', assignmentsRoutes);
router.use('/progress', progressRoutes);
router.use('/ai', aiRoutes);

module.exports = router;
