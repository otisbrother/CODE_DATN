const ApiResponse = require('../utils/apiResponse');

/**
 * Middleware to check if user has one of the allowed roles
 * @param  {...string} allowedRoles - Role names (e.g., 'admin', 'lecturer', 'student')
 */
const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Chưa xác thực');
    }
    if (!allowedRoles.includes(req.user.role_name)) {
      return ApiResponse.forbidden(res, 'Bạn không có quyền thực hiện thao tác này');
    }
    next();
  };
};

module.exports = roleMiddleware;
