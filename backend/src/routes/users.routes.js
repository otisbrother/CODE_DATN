const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

router.use(authMiddleware);
router.get('/', roleMiddleware('admin'), usersController.getAll);
router.get('/:id', roleMiddleware('admin'), usersController.getById);
router.put('/:id', roleMiddleware('admin'), usersController.update);
router.delete('/:id', roleMiddleware('admin'), usersController.remove);

module.exports = router;
