const express = require('express');
const router = express.Router();
const aiDataCtrl = require('../controllers/aiData.controller');
const aiChatCtrl = require('../controllers/aiChat.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const { uploadAiData } = require('../middlewares/upload.middleware');

// AI Data Sources — giáo viên tự quản lý dữ liệu AI khóa học của mình (dùng trực tiếp, không cần duyệt)
router.get('/data/course/:courseId', authMiddleware, roleMiddleware('lecturer', 'admin'), aiDataCtrl.getByCourse);
router.post('/data', authMiddleware, roleMiddleware('lecturer'), uploadAiData.single('file'), aiDataCtrl.create);
router.put('/data/:id', authMiddleware, roleMiddleware('lecturer', 'admin'), uploadAiData.single('file'), aiDataCtrl.update);
router.delete('/data/:id', authMiddleware, roleMiddleware('lecturer', 'admin'), aiDataCtrl.remove);

// AI Conversations
router.get('/conversations/course/:courseId', authMiddleware, roleMiddleware('student'), aiChatCtrl.getConversations);
router.get('/conversations/:conversationId/messages', authMiddleware, roleMiddleware('student'), aiChatCtrl.getMessages);

// AI Chat
router.post('/chat', authMiddleware, roleMiddleware('student'), aiChatCtrl.chat);
router.post('/learning-assistant/qa', authMiddleware, roleMiddleware('student'), aiChatCtrl.learningAssistantQa);
router.post('/learning-assistant/test', authMiddleware, roleMiddleware('lecturer', 'admin'), aiChatCtrl.lecturerTestLearningAssistant);
router.post('/learning-assistant/path', authMiddleware, roleMiddleware('student'), aiChatCtrl.learningPath);
router.get('/learning-assistant/schedule', authMiddleware, roleMiddleware('student'), aiChatCtrl.studySchedule);
router.get('/learning-assistant/schedule/saved', authMiddleware, roleMiddleware('student'), aiChatCtrl.getSavedSchedule);
router.put('/learning-assistant/schedule/saved', authMiddleware, roleMiddleware('student'), aiChatCtrl.saveSchedule);

module.exports = router;
