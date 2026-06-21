const express = require('express');
const router = express.Router();
const reviewsController = require('../controllers/reviews.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// Lecturer/Admin: phản hồi <=2 sao
router.get('/feedback', authMiddleware, roleMiddleware('lecturer', 'admin'), reviewsController.getFeedback);

// Public: khóa học trending (4+ sao)
router.get('/trending', reviewsController.getTrending);

// Public: tất cả khóa học kèm rating (cho homepage)
router.get('/with-ratings', reviewsController.getWithRatings);

// Public: xem reviews của 1 khóa học
router.get('/:id/reviews', reviewsController.getReviews);

// Student: kiểm tra quyền review
router.get('/:id/reviews/check', authMiddleware, roleMiddleware('student'), reviewsController.checkCanReview);

// Student: gửi/cập nhật đánh giá
router.post('/:id/reviews', authMiddleware, roleMiddleware('student'), reviewsController.createReview);

module.exports = router;
