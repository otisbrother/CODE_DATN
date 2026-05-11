const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbot.controller');

// POST /api/chatbot/ask — Public endpoint (không cần đăng nhập)
router.post('/ask', chatbotController.askChatbot);

module.exports = router;
