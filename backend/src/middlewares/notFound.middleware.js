const ApiResponse = require('../utils/apiResponse');

const notFoundMiddleware = (req, res) => {
  return ApiResponse.notFound(res, `Route ${req.originalUrl} không tồn tại`);
};

module.exports = notFoundMiddleware;
