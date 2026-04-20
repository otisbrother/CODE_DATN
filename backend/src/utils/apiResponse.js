class ApiResponse {
  static success(res, data = null, message = 'Thành công', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static created(res, data = null, message = 'Tạo thành công') {
    return res.status(201).json({
      success: true,
      message,
      data,
    });
  }

  static error(res, message = 'Lỗi hệ thống', statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }

  static notFound(res, message = 'Không tìm thấy') {
    return res.status(404).json({
      success: false,
      message,
    });
  }

  static unauthorized(res, message = 'Không có quyền truy cập') {
    return res.status(401).json({
      success: false,
      message,
    });
  }

  static forbidden(res, message = 'Không đủ quyền hạn') {
    return res.status(403).json({
      success: false,
      message,
    });
  }

  static paginated(res, data, pagination, message = 'Thành công') {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination,
    });
  }
}

module.exports = ApiResponse;
