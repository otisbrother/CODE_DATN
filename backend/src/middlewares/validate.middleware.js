const { validationResult } = require('express-validator');
const ApiResponse = require('../utils/apiResponse');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((e) => e.msg);
    return ApiResponse.error(res, 'Dữ liệu không hợp lệ', 400, errorMessages);
  }
  next();
};

module.exports = validate;
