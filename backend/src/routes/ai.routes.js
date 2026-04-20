const express = require('express');
const router = express.Router();
const aiDataCtrl = require('../controllers/aiData.controller');
const aiChatCtrl = require('../controllers/aiChat.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const { uploadAiData } = require('../middlewares/upload.middleware');

// AI Data Sources
router.get('/data', authMiddleware, roleMiddleware('admin'), aiDataCtrl.getAll);
router.get('/data/course/:courseId', authMiddleware, roleMiddleware('lecturer', 'admin'), aiDataCtrl.getByCourse);
router.post('/data', authMiddleware, roleMiddleware('lecturer'), uploadAiData.single('file'), aiDataCtrl.create);
router.put('/data/:id/approve', authMiddleware, roleMiddleware('admin'), aiDataCtrl.approve);
router.put('/data/:id/reject', authMiddleware, roleMiddleware('admin'), aiDataCtrl.reject);

// AI Conversations
router.get('/conversations/course/:courseId', authMiddleware, roleMiddleware('student'), aiChatCtrl.getConversations);
router.get('/conversations/:conversationId/messages', authMiddleware, roleMiddleware('student'), aiChatCtrl.getMessages);

// AI Chat
router.post('/chat', authMiddleware, roleMiddleware('student'), aiChatCtrl.chat);

module.exports = router;
