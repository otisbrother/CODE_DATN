const ApiResponse = require('../utils/apiResponse');

const errorMiddleware = (err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Lỗi máy chủ nội bộ';

  return ApiResponse.error(res, message, statusCode);
};

module.exports = errorMiddleware;
