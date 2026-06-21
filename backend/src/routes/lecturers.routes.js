const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/lecturers.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const { uploadAvatar } = require('../middlewares/upload.middleware');

// --- Routes cua giang vien dang dang nhap (dat TRUOC /:id de khong bi nuot) ---
router.get('/me/profile', authMiddleware, roleMiddleware('lecturer', 'admin'), ctrl.getMyProfile);
router.put('/me/profile', authMiddleware, roleMiddleware('lecturer', 'admin'),
  uploadAvatar.single('avatar'), ctrl.updateMyProfile);

// --- Public ---
router.get('/', ctrl.getPublicLecturers);
router.get('/:id', ctrl.getPublicLecturer);

module.exports = router;
