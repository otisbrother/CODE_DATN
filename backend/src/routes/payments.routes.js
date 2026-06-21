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
  const directPaymentId = getWebhookValue(body, ['paymentId', 'payment_id', 'orderId', 'order_id', 'orderCode', 'order_code']);
  if (directPaymentId) return Number(directPaymentId);

  const paymentCode = getWebhookValue(body, ['code', 'paymentCode', 'payment_code']);
  const match = `${paymentCode || ''} ${content || ''}`.match(/ELEARNING\s*#?\s*(\d+)/i);
  return match ? Number(match[1]) : null;
};

const normalizeAccountNo = (value) => String(value || '').replace(/\s+/g, '');

const isIncomingTransfer = (transaction) => {
  const transferType = getWebhookValue(transaction, ['transferType', 'transfer_type', 'type', 'transactionType']);
  if (!transferType) return true;

  return ['in', 'credit', 'receive', 'incoming', 'deposit'].includes(String(transferType).toLowerCase());
};

const getProvidedWebhookSecret = (req) => {
  const authorization = String(req.headers.authorization || '').trim();
  const authSecret = authorization.replace(/^(Bearer|Apikey)\s+/i, '').trim();
  return req.headers['x-webhook-secret'] || req.headers['x-secret-key'] || req.headers['x-sepay-secret'] || authSecret;
};

const sendSepayAck = (res) => res.status(200).json({ success: true });

// SePay bank webhook. Configure SePay to call this URL when the admin bank
// account receives a matching incoming transfer.
router.get('/bank-webhook', (req, res) => {
  return ApiResponse.success(res, {
    method: 'POST',
    provider: 'SePay',
    response: { success: true },
    message: 'SePay bank webhook endpoint is ready',
  });
});

router.post('/bank-webhook', asyncHandler(async (req, res) => {
  const webhookSecret = env.SEPAY_WEBHOOK_SECRET || env.BANK_WEBHOOK_SECRET;
  // Fail-closed: tu choi neu chua cau hinh secret, tranh endpoint cong khai
  // cho phep kich hoat khoa hoc ma khong tra tien.
  if (!webhookSecret) {
    console.error('[bank-webhook] SEPAY_WEBHOOK_SECRET chua duoc cau hinh - tu choi webhook');
    return ApiResponse.error(res, 'Webhook chua duoc cau hinh', 503);
  }
  const providedSecret = getProvidedWebhookSecret(req);
  if (providedSecret !== webhookSecret) {
    return ApiResponse.forbidden(res, 'Webhook secret khong hop le');
  }

  const results = [];
  for (const transaction of getWebhookTransactions(req.body)) {
    if (!isIncomingTransfer(transaction)) continue;

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
      'transfer_amount',
      'transactionAmount',
      'transaction_amount',
      'creditAmount',
    ]);
    const bankReference = getWebhookValue(transaction, [
      'referenceCode',
      'reference_code',
      'transactionId',
      'transaction_id',
      'refNo',
      'tid',
      'id',
    ]);
    const accountNo = getWebhookValue(transaction, [
      'accountNo',
      'accountNumber',
      'account_number',
      'receiverAccount',
      'subAccount',
      'sub_account',
      'bank_sub_acc_id',
      'subAccId',
    ]);
    const paymentId = extractPaymentId(transaction, content);

    if (!paymentId) continue;
    if (accountNo && normalizeAccountNo(accountNo) !== normalizeAccountNo(env.ADMIN_BANK_ACCOUNT_NO)) continue;

    const result = await enrollService.completePaymentFromBank({
      paymentId,
      amount,
      content,
      bankReference,
    });
    results.push(result);
  }

  if (results.length === 0) {
    return sendSepayAck(res);
  }

  return sendSepayAck(res);
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
    original_amount: payment.original_amount,
    discount_amount: payment.discount_amount,
    voucher_code: payment.voucher_code,
    voucher_name: payment.voucher_name,
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
