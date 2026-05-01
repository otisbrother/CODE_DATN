const express = require('express');
const router = express.Router();
const paymentRepo = require('../repositories/payments.repository');
const enrollService = require('../services/enrollments.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const env = require('../config/env');

const getWebhookTransactions = (body) => {
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.transactions)) return body.transactions;
  return [body];
};

const getWebhookValue = (body, keys) => {
  for (const key of keys) {
    if (body?.[key] !== undefined && body?.[key] !== null) return body[key];
    if (!Array.isArray(body?.data) && body?.data?.[key] !== undefined && body?.data?.[key] !== null) return body.data[key];
  }
  return undefined;
};

const extractPaymentId = (body, content) => {
  const directPaymentId = getWebhookValue(body, ['paymentId', 'payment_id', 'orderId', 'order_id']);
  if (directPaymentId) return Number(directPaymentId);

  const match = String(content || '').match(/ELEARNING\s*#?\s*(\d+)/i);
  return match ? Number(match[1]) : null;
};

// Bank/payment-provider webhook. Configure the provider to call this URL
// when the admin bank account receives a matching transfer.
router.get('/bank-webhook', (req, res) => {
  return ApiResponse.success(res, {
    method: 'POST',
    message: 'Bank webhook endpoint is ready',
  });
});

router.post('/bank-webhook', asyncHandler(async (req, res) => {
  if (env.BANK_WEBHOOK_SECRET) {
    const providedSecret = req.headers['x-webhook-secret'] || req.headers['x-secret-key'];
    if (providedSecret !== env.BANK_WEBHOOK_SECRET) {
      return ApiResponse.forbidden(res, 'Webhook secret khong hop le');
    }
  }

  const results = [];
  for (const transaction of getWebhookTransactions(req.body)) {
    const content = getWebhookValue(transaction, [
      'content',
      'description',
      'transactionContent',
      'transferContent',
      'addInfo',
    ]);
    const amount = getWebhookValue(transaction, [
      'amount',
      'transferAmount',
      'transactionAmount',
      'creditAmount',
    ]);
    const bankReference = getWebhookValue(transaction, [
      'referenceCode',
      'transactionId',
      'transaction_id',
      'refNo',
      'tid',
      'id',
    ]);
    const accountNo = getWebhookValue(transaction, [
      'accountNo',
      'accountNumber',
      'receiverAccount',
      'subAccount',
      'bank_sub_acc_id',
      'subAccId',
    ]);
    const paymentId = extractPaymentId(transaction, content);

    if (!paymentId) continue;
    if (accountNo && String(accountNo) !== String(env.ADMIN_BANK_ACCOUNT_NO)) continue;

    const result = await enrollService.completePaymentFromBank({
      paymentId,
      amount,
      content,
      bankReference,
    });
    results.push(result);
  }

  if (results.length === 0) {
    return ApiResponse.success(res, {
      ignored: true,
      reason: 'Khong co giao dich nao khop noi dung ELEARNING <paymentId>',
    }, 'Webhook da nhan nhung khong co giao dich can xu ly');
  }

  return ApiResponse.success(res, results, 'Da ghi nhan thanh toan tu ngan hang');
}));

router.use(authMiddleware);

// Student/Admin: poll payment status after the student scans the QR.
router.get('/:paymentId/status', asyncHandler(async (req, res) => {
  const payment = await paymentRepo.findById(req.params.paymentId);
  if (!payment) return ApiResponse.notFound(res, 'Khong tim thay thanh toan');

  const isOwner = payment.user_id === req.user.id;
  const isAdmin = req.user.role_name === 'admin';
  if (!isOwner && !isAdmin) return ApiResponse.forbidden(res);

  return ApiResponse.success(res, {
    id: payment.id,
    payment_status: payment.payment_status,
    paid_at: payment.paid_at,
    total_amount: payment.total_amount,
    course_id: payment.course_id,
    course_title: payment.course_title,
  });
}));

// Student: xem payments cua minh
router.get('/my', roleMiddleware('student'), asyncHandler(async (req, res) => {
  const data = await paymentRepo.findByUser(req.user.id);
  return ApiResponse.success(res, data);
}));

// Admin: xem tat ca payments (lich su thanh toan)
router.get('/', roleMiddleware('admin'), asyncHandler(async (req, res) => {
  const data = await paymentRepo.findAll(req.query.status || null);
  return ApiResponse.success(res, data);
}));

module.exports = router;
