import crypto from 'crypto';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';


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

    const amount = order.total_amount;
    const transaction_uuid = `${order._id}-${Date.now()}`;
    const product_code = process.env.ESEWA_MERCHANT_ID || 'EPAYTEST';
    
    // Create signature for eSewa v2
    const data = `total_amount=${amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
    const secretKey = process.env.ESEWA_SECRET_KEY || '8g8t8h8m6qnd9p';
    const hash = crypto.createHmac('sha256', secretKey).update(data).digest('base64');

    const paymentData = {
      amount,
      tax_amount: 0,
      total_amount: amount,
      transaction_uuid,
      product_code,
      product_service_charge: 0,
      product_delivery_charge: 0,
      success_url: `${process.env.FRONTEND_URL}/payment-success/esewa`,
      failure_url: `${process.env.FRONTEND_URL}/payment-failure`,
      signed_field_names: 'total_amount,transaction_uuid,product_code',
      signature: hash
    };

    res.status(200).json({ success: true, data: paymentData });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Verify eSewa Payment
// @route   GET /api/payments/esewa/verify
// @access  Public (Callback from eSewa)
export const verifyEsewa = async (req, res) => {
  try {
    const { data } = req.query; // eSewa sends encoded data in query string
    const decoded = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
    
    const { status, total_amount, transaction_uuid, transaction_code, signed_field_names, signature } = decoded;

    // Split orderId from transaction_uuid
    const orderId = transaction_uuid.split('-')[0];
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (status === 'COMPLETE') {
      order.status = 'confirmed';
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

      return res.redirect(`${process.env.FRONTEND_URL}/orders?success=true`);
    }

    res.redirect(`${process.env.FRONTEND_URL}/orders?success=false`);
  } catch (err) {
    console.error('eSewa Verification Error:', err);
    res.redirect(`${process.env.FRONTEND_URL}/orders?success=false`);
  }
};

