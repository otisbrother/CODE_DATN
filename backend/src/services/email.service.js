const nodemailer = require('nodemailer');
const env = require('../config/env');

// Tạo transporter (dùng Gmail SMTP hoặc bất kỳ SMTP nào)
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

/**
 * Gửi email xác nhận thanh toán thành công
 */
const sendPaymentSuccessEmail = async (toEmail, data) => {
  if (!env.SMTP_USER) {
    console.log('⚠️ SMTP chưa cấu hình, bỏ qua gửi email');
    return;
  }

  const { fullName, courseName, amount, paymentId, paymentMethod } = data;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .card { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #1e2243, #4f46e5); color: #fff; padding: 32px; text-align: center; }
        .header h1 { margin: 0 0 8px; font-size: 24px; }
        .header p { margin: 0; opacity: 0.8; font-size: 14px; }
        .body { padding: 32px; }
        .success-icon { text-align: center; font-size: 48px; margin-bottom: 16px; }
        .success-text { text-align: center; color: #059669; font-size: 20px; font-weight: 700; margin-bottom: 24px; }
        .info-table { width: 100%; border-collapse: collapse; }
        .info-table tr { border-bottom: 1px solid #f0f0f0; }
        .info-table td { padding: 12px 0; font-size: 14px; }
        .info-table td:first-child { color: #6b7280; width: 40%; }
        .info-table td:last-child { font-weight: 600; color: #1f2937; }
        .amount { color: #059669; font-size: 18px; font-weight: 800; }
        .footer { background: #f9fafb; padding: 20px 32px; text-align: center; font-size: 12px; color: #9ca3af; }
        .btn { display: inline-block; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="header">
            <h1>🎓 E-Learning AI</h1>
            <p>Hệ thống học trực tuyến</p>
          </div>
          <div class="body">
            <div class="success-icon">✅</div>
            <div class="success-text">Thanh toán thành công!</div>
            <p style="text-align:center; color:#6b7280; margin-bottom:24px;">
              Xin chào <strong>${fullName}</strong>, bạn đã thanh toán thành công và khóa học đã được mở khóa.
            </p>
            <table class="info-table">
              <tr><td>Mã giao dịch</td><td>#${paymentId}</td></tr>
              <tr><td>Khóa học</td><td>${courseName}</td></tr>
              <tr><td>Số tiền</td><td class="amount">${Number(amount).toLocaleString('vi-VN')}đ</td></tr>
              <tr><td>Phương thức</td><td>${paymentMethod === 'bank_transfer' ? 'Chuyển khoản ngân hàng' : paymentMethod === 'free' ? 'Miễn phí' : paymentMethod}</td></tr>
              <tr><td>Thời gian</td><td>${new Date().toLocaleString('vi-VN')}</td></tr>
              <tr><td>Trạng thái</td><td style="color:#059669">✅ Đã thanh toán</td></tr>
            </table>
            <div style="text-align:center">
              <a href="http://localhost:5173/student/courses" class="btn">▶ Bắt đầu học ngay</a>
            </div>
          </div>
          <div class="footer">
            <p>E-Learning AI — Đồ án tốt nghiệp Đại học Thủy Lợi</p>
            <p>Email này được gửi tự động, vui lòng không phản hồi.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: toEmail,
      subject: `✅ Thanh toán thành công - ${courseName}`,
      html: htmlContent,
    });
    console.log(`📧 Email xác nhận đã gửi tới ${toEmail}`);
  } catch (err) {
    console.error('❌ Lỗi gửi email:', err.message);
    // Không throw error để không block flow thanh toán
  }
};

module.exports = { sendPaymentSuccessEmail };
