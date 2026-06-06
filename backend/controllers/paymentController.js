import crypto from 'crypto';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';

const ESEWA_FORM_URL =
  process.env.ESEWA_FORM_URL || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
const ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE || process.env.ESEWA_MERCHANT_ID || 'EPAYTEST';
// UAT secret from eSewa Epay docs. Keep ESEWA_SECRET_KEY in .env in sync with this.
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_CURRENCY = process.env.STRIPE_CURRENCY || 'npr';

const SIGNED_FIELD_NAMES = 'total_amount,transaction_uuid,product_code';

const formatAmount = (value) => {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return '0';
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
};

const signEsewaPayload = ({ total_amount, transaction_uuid, product_code }) => {
  const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
  return crypto.createHmac('sha256', ESEWA_SECRET_KEY).update(message).digest('base64');
};

const verifyEsewaSignature = (payload) => {
  const { signed_field_names, signature } = payload;
  if (!signed_field_names || !signature) return false;

  const message = signed_field_names
    .split(',')
    .map((field) => `${field}=${payload[field]}`)
    .join(',');

  const expected = crypto.createHmac('sha256', ESEWA_SECRET_KEY).update(message).digest('base64');
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signature);

  return (
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  );
};

const decodeEsewaData = (data) => JSON.parse(Buffer.from(data, 'base64').toString('utf8'));

const buildResultUrl = (params) => {
  const url = new URL('/payment-result', FRONTEND_URL);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.set(key, value);
  });
  return url.toString();
};

const markOrderPaymentFailed = async (order, reason, gatewayResponse = null) => {
  if (order && order.payment_status !== 'paid' && order.status === 'pending') {
    order.status = 'cancelled';
    order.statusHistory.push({
      status: 'cancelled',
      note: `eSewa payment failed: ${reason}`,
      timestamp: new Date(),
    });
    await order.save();
  }

  if (order) {
    await Payment.findOneAndUpdate(
      { order: order._id },
      {
        status: 'failed',
        gatewayResponse: gatewayResponse
          ? { response: gatewayResponse, reason }
          : { reason },
      }
    );
  }
};

// @desc    Build eSewa v2 test payment form payload
// @route   POST /api/payments/esewa/initiate
// @access  Private
export const initiateEsewa = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.customer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized for this order' });
    }

    if (order.paymentMethod !== 'esewa') {
      return res.status(400).json({ success: false, message: 'Order was not created for eSewa payment' });
    }

    if (order.payment_status === 'paid') {
      return res.status(400).json({ success: false, message: 'This order is already paid' });
    }

    const amount = formatAmount(order.total_amount);
    const transaction_uuid = `${order._id}-${Date.now()}`;
    const product_code = ESEWA_PRODUCT_CODE;

    const formData = {
      amount,
      tax_amount: '0',
      total_amount: amount,
      transaction_uuid,
      product_code,
      product_service_charge: '0',
      product_delivery_charge: '0',
      success_url: `${BACKEND_URL}/api/payments/esewa/verify`,
      failure_url: `${BACKEND_URL}/api/payments/esewa/failure?orderId=${order._id}`,
      signed_field_names: SIGNED_FIELD_NAMES,
    };

    formData.signature = signEsewaPayload(formData);

    await Payment.findOneAndUpdate(
      { order: order._id },
      {
        order: order._id,
        user: order.customer,
        method: 'esewa',
        transaction_id: transaction_uuid,
        amount: order.total_amount,
        status: 'pending',
        gatewayResponse: { request: formData },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      data: {
        action_url: ESEWA_FORM_URL,
        formData,
      },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Verify eSewa v2 callback
// @route   GET /api/payments/esewa/verify
// @access  Public
export const verifyEsewa = async (req, res) => {
  try {
    const { data } = req.query;

    if (!data) {
      return res.redirect(buildResultUrl({ status: 'failed', reason: 'no_data' }));
    }

    const decoded = decodeEsewaData(data);
    const {
      status,
      total_amount,
      transaction_uuid,
      transaction_code,
    } = decoded;

    if (!verifyEsewaSignature(decoded)) {
      console.error('[eSewa] Invalid callback signature:', decoded);
      return res.redirect(buildResultUrl({ status: 'failed', reason: 'invalid_signature' }));
    }

    const orderId = transaction_uuid?.split('-')[0];
    const order = await Order.findById(orderId);

    if (!order) {
      return res.redirect(buildResultUrl({ status: 'failed', reason: 'order_not_found' }));
    }

    const paidAmount = Number(total_amount);
    if (Number.isFinite(paidAmount) && paidAmount !== Number(order.total_amount)) {
      await Payment.findOneAndUpdate(
        { order: order._id },
        {
          status: 'failed',
          gatewayResponse: { response: decoded, reason: 'amount_mismatch' },
        }
      );
      await markOrderPaymentFailed(order, 'amount_mismatch', decoded);
      return res.redirect(buildResultUrl({ status: 'failed', reason: 'amount_mismatch', orderId: order._id }));
    }

    if (status !== 'COMPLETE') {
      await markOrderPaymentFailed(order, 'payment_incomplete', decoded);
      return res.redirect(buildResultUrl({ status: 'failed', reason: 'payment_incomplete', orderId: order._id }));
    }

    order.payment_status = 'paid';
    await order.save();

    await Payment.findOneAndUpdate(
      { order: order._id },
      {
        transaction_id: transaction_code || transaction_uuid,
        amount: order.total_amount,
        status: 'success',
        gatewayResponse: { response: decoded },
        paid_at: new Date(),
      },
      { new: true }
    );

    return res.redirect(buildResultUrl({ status: 'success', orderId: order._id }));
  } catch (err) {
    console.error('[eSewa] Verification error:', err);
    return res.redirect(buildResultUrl({ status: 'failed', reason: 'server_error' }));
  }
};

// @desc    Handle eSewa failure/cancel redirect
// @route   GET /api/payments/esewa/failure
// @access  Public
export const failEsewa = async (req, res) => {
  try {
    const { orderId } = req.query;
    const order = orderId ? await Order.findById(orderId) : null;

    if (order) {
      await markOrderPaymentFailed(order, 'payment_cancelled');
    }

    return res.redirect(buildResultUrl({
      status: 'failed',
      reason: 'payment_cancelled',
      orderId,
    }));
  } catch (err) {
    console.error('[eSewa] Failure callback error:', err);
    return res.redirect(buildResultUrl({ status: 'failed', reason: 'server_error' }));
  }
};

const buildStripeSessionPayload = (order) => {
  const amountInSmallestUnit = Math.round(Number(order.total_amount) * 100);
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const description = `${itemCount} item${itemCount === 1 ? '' : 's'} from Chulo`;

  return new URLSearchParams({
    mode: 'payment',
    success_url: `${BACKEND_URL}/api/payments/stripe/verify?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${BACKEND_URL}/api/payments/stripe/failure?orderId=${order._id}`,
    'line_items[0][price_data][currency]': STRIPE_CURRENCY,
    'line_items[0][price_data][unit_amount]': String(amountInSmallestUnit),
    'line_items[0][price_data][product_data][name]': `Chulo Order ${order.orderNumber}`,
    'line_items[0][price_data][product_data][description]': description,
    'line_items[0][quantity]': '1',
    customer_creation: 'always',
    'metadata[orderId]': String(order._id),
    'metadata[userId]': String(order.customer),
    'metadata[orderNumber]': String(order.orderNumber),
  });
};

const markStripeOrderFailed = async (order, reason, gatewayResponse = null) => {
  if (order && order.payment_status !== 'paid' && order.status === 'pending') {
    order.status = 'cancelled';
    order.statusHistory.push({
      status: 'cancelled',
      note: `Stripe payment failed: ${reason}`,
      timestamp: new Date(),
    });
    await order.save();
  }

  if (order) {
    await Payment.findOneAndUpdate(
      { order: order._id },
      {
        status: 'failed',
        gatewayResponse: gatewayResponse ? { response: gatewayResponse, reason } : { reason },
      }
    );
  }
};

// @desc    Create Stripe Checkout Session
// @route   POST /api/payments/stripe/initiate
// @access  Private
export const initiateStripe = async (req, res) => {
  try {
    if (!STRIPE_SECRET_KEY) {
      return res.status(500).json({ success: false, message: 'Stripe is not configured' });
    }

    const { orderId } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.customer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized for this order' });
    }

    if (order.paymentMethod !== 'stripe') {
      return res.status(400).json({ success: false, message: 'Order was not created for Stripe payment' });
    }

    if (order.payment_status === 'paid') {
      return res.status(400).json({ success: false, message: 'This order is already paid' });
    }

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: buildStripeSessionPayload(order),
    });

    const session = await stripeRes.json();

    if (!stripeRes.ok || !session.url) {
      return res.status(400).json({
        success: false,
        message: session.error?.message || 'Unable to create Stripe checkout session',
      });
    }

    await Payment.findOneAndUpdate(
      { order: order._id },
      {
        order: order._id,
        user: order.customer,
        method: 'stripe',
        transaction_id: session.id,
        amount: order.total_amount,
        status: 'pending',
        gatewayResponse: { request: { sessionId: session.id, url: session.url } },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
      },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Verify Stripe Checkout Session
// @route   GET /api/payments/stripe/verify
// @access  Public
export const verifyStripe = async (req, res) => {
  try {
    if (!STRIPE_SECRET_KEY) {
      return res.redirect(buildResultUrl({ status: 'failed', reason: 'stripe_not_configured' }));
    }

    const rawSessionId = req.query.session_id;
    const sessionId = typeof rawSessionId === 'string'
      ? rawSessionId.replace(/[^a-zA-Z0-9_\-]/g, '')
      : '';

    if (!sessionId) {
      return res.redirect(buildResultUrl({ status: 'failed', reason: 'no_session' }));
    }

    const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      },
    });

    const session = await stripeRes.json();

    if (!stripeRes.ok || session.payment_status !== 'paid') {
      const order = session.metadata?.orderId ? await Order.findById(session.metadata.orderId) : null;
      await markStripeOrderFailed(order, 'payment_incomplete', session);
      return res.redirect(buildResultUrl({
        status: 'failed',
        reason: 'payment_incomplete',
        orderId: session.metadata?.orderId,
      }));
    }

    const order = await Order.findById(session.metadata?.orderId);

    if (!order) {
      return res.redirect(buildResultUrl({ status: 'failed', reason: 'order_not_found' }));
    }

    const paidAmount = Number(session.amount_total) / 100;
    if (Number.isFinite(paidAmount) && paidAmount !== Number(order.total_amount)) {
      await markStripeOrderFailed(order, 'amount_mismatch', session);
      return res.redirect(buildResultUrl({ status: 'failed', reason: 'amount_mismatch', orderId: order._id }));
    }

    order.payment_status = 'paid';
    await order.save();

    await Payment.findOneAndUpdate(
      { order: order._id },
      {
        transaction_id: session.payment_intent || session.id,
        amount: order.total_amount,
        status: 'success',
        gatewayResponse: { response: session },
        paid_at: new Date(),
      },
      { new: true }
    );

    return res.redirect(buildResultUrl({ status: 'success', orderId: order._id }));
  } catch (err) {
    console.error('[Stripe] Verification error:', err);
    return res.redirect(buildResultUrl({ status: 'failed', reason: 'server_error' }));
  }
};

// @desc    Handle Stripe cancel redirect
// @route   GET /api/payments/stripe/failure
// @access  Public
export const failStripe = async (req, res) => {
  try {
    const { orderId } = req.query;
    const order = orderId ? await Order.findById(orderId) : null;

    if (order) {
      await markStripeOrderFailed(order, 'payment_cancelled');
    }

    return res.redirect(buildResultUrl({
      status: 'failed',
      reason: 'payment_cancelled',
      method: 'stripe',
      orderId,
    }));
  } catch (err) {
    console.error('[Stripe] Failure callback error:', err);
    return res.redirect(buildResultUrl({ status: 'failed', reason: 'server_error' }));
  }
};
