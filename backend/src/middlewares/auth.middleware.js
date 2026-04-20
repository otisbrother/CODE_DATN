const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const ApiResponse = require('../utils/apiResponse');
const db = require('../config/db');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.unauthorized(res, 'Token không được cung cấp');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtConfig.secret);

    // Fetch user with role
    const [rows] = await db.query(
      `SELECT u.id, u.full_name, u.email, u.status, u.role_id, r.role_name
       FROM users u JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [decoded.id]
    );

    if (rows.length === 0) {
      return ApiResponse.unauthorized(res, 'Người dùng không tồn tại');
    }

    if (rows[0].status !== 'active') {
      return ApiResponse.forbidden(res, 'Tài khoản đã bị khóa');
    }

    req.user = rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, 'Token đã hết hạn');
    }
    return ApiResponse.unauthorized(res, 'Token không hợp lệ');
  }
};

module.exports = authMiddleware;
