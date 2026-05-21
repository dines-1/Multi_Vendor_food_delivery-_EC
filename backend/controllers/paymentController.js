import crypto from 'crypto';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';

// ─── eSewa Sandbox / Test Credentials ──────────────────────────────────────
// These are the OFFICIAL eSewa test credentials for the RC (sandbox) environment.
// Switch to live values via .env in production.
const ESEWA_MERCHANT_ID = process.env.ESEWA_MERCHANT_ID || 'EPAYTEST';
const ESEWA_SECRET_KEY  = process.env.ESEWA_SECRET_KEY  || '8gBm/:&EnhH.1[v';
const BACKEND_URL       = process.env.BACKEND_URL        || 'http://localhost:5000';
const FRONTEND_URL      = process.env.FRONTEND_URL       || 'http://localhost:5173';

// Helper – build HMAC-SHA256 base64 signature
const buildSignature = (total_amount, transaction_uuid, product_code) => {
  const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
  return crypto.createHmac('sha256', ESEWA_SECRET_KEY).update(message).digest('base64');
};

// Helper – verify the signature sent back by eSewa
const verifySignature = (decoded) => {
  const { signed_field_names, signature } = decoded;
  if (!signed_field_names || !signature) return false;

  const fields = signed_field_names.split(',');
  const message = fields.map(f => `${f}=${decoded[f]}`).join(',');
  const expected = crypto.createHmac('sha256', ESEWA_SECRET_KEY).update(message).digest('base64');
  return expected === signature;
};


// @desc    Initiate eSewa Payment
// @route   POST /api/payments/esewa/initiate
// @access  Private
export const initiateEsewa = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const amount           = order.total_amount;
    const transaction_uuid = `${order._id}-${Date.now()}`;
    const product_code     = ESEWA_MERCHANT_ID;

    const paymentData = {
      amount,
      tax_amount: 0,
      total_amount: amount,
      transaction_uuid,
      product_code,
      product_service_charge: 0,
      product_delivery_charge: 0,
      // ✅ success_url points to BACKEND so we can verify before showing result
      success_url: `${BACKEND_URL}/api/payments/esewa/verify`,
      failure_url: `${FRONTEND_URL}/payment-failure`,
      signed_field_names: 'total_amount,transaction_uuid,product_code',
      signature: buildSignature(amount, transaction_uuid, product_code)
    };

    res.status(200).json({ success: true, data: paymentData });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Verify eSewa Payment (called by eSewa redirect, NOT the frontend)
// @route   GET /api/payments/esewa/verify
// @access  Public (Callback from eSewa)
export const verifyEsewa = async (req, res) => {
  try {
    const { data } = req.query; // eSewa encodes response as base64 JSON

    if (!data) {
      return res.redirect(`${FRONTEND_URL}/payment-result?status=failed&reason=no_data`);
    }

    // Decode the base64 JSON payload
    const decoded = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
    const { status, total_amount, transaction_uuid, transaction_code } = decoded;

    // ✅ Verify eSewa's signature to prevent spoofing
    if (!verifySignature(decoded)) {
      console.error('[eSewa] Signature mismatch – possible tampered response');
      return res.redirect(`${FRONTEND_URL}/payment-result?status=failed&reason=invalid_signature`);
    }

    // Extract orderId – format is "<24-char ObjectId>-<timestamp>"
    const orderId = transaction_uuid.substring(0, 24);
    const order = await Order.findById(orderId);

    if (!order) {
      return res.redirect(`${FRONTEND_URL}/payment-result?status=failed&reason=order_not_found`);
    }

    if (status === 'COMPLETE') {
      // Prevent duplicate payment records
      const existing = await Payment.findOne({ transaction_id: transaction_code });
      if (!existing) {
        order.status = 'confirmed';
        order.payment_status = 'paid';
        await order.save();

        await Payment.create({
          order: order._id,
          user: order.customer,
          method: 'esewa',
          transaction_id: transaction_code,
          amount: total_amount,
          status: 'success',
          paid_at: Date.now()
        });
      }

      return res.redirect(`${FRONTEND_URL}/payment-result?status=success&orderId=${order._id}`);
    }

    return res.redirect(`${FRONTEND_URL}/payment-result?status=failed&reason=payment_incomplete`);
  } catch (err) {
    console.error('[eSewa] Verification Error:', err);
    return res.redirect(`${FRONTEND_URL}/payment-result?status=failed&reason=server_error`);
  }
};

