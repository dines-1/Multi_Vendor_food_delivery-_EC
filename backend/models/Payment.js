import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    method: {
      type: String,
      enum: ['esewa', 'khalti', 'cash', 'card'],
      required: true,
    },
    transaction_id: {
      type: String,
      unique: true,
      sparse: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'refunded'],
      default: 'pending',
    },
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
    },
    paid_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
paymentSchema.index({ order: 1 }, { unique: true });
paymentSchema.index({ transaction_id: 1 }, { unique: true, sparse: true });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
