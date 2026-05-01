const express = require('express');
const router = express.Router();
const adminStatsCtrl = require('../controllers/admin.stats.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

router.use(authMiddleware);
router.use(roleMiddleware('admin'));

router.get('/stats', adminStatsCtrl.getStats);

module.exports = router;
