const express = require('express');
const router = express.Router();
const vouchersController = require('../controllers/vouchers.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

router.get('/public/promotions', vouchersController.getPublicPromotions);
router.get('/public/promotions/:id', vouchersController.getPublicPromotionById);

router.use(authMiddleware);

router.get('/preview/course/:courseId', roleMiddleware('student'), vouchersController.previewForCourse);

router.get('/', roleMiddleware('admin'), vouchersController.getAll);
router.get('/:id', roleMiddleware('admin'), vouchersController.getById);
router.post('/', roleMiddleware('admin'), vouchersController.create);
router.put('/:id', roleMiddleware('admin'), vouchersController.update);
router.delete('/:id', roleMiddleware('admin'), vouchersController.remove);

module.exports = router;
