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
const sectionsRoutes = require('./sections.routes');
const adminStatsRoutes = require('./admin.stats.routes');
const paymentsRoutes = require('./payments.routes');

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/courses', coursesRoutes);
router.use('/enrollments', enrollmentsRoutes);
router.use('/lessons', lessonsRoutes);
router.use('/assignments', assignmentsRoutes);
router.use('/progress', progressRoutes);
router.use('/ai', aiRoutes);
router.use('/sections', sectionsRoutes);
router.use('/admin', adminStatsRoutes);
router.use('/payments', paymentsRoutes);

module.exports = router;
