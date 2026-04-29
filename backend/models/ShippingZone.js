import mongoose from 'mongoose';

const shippingZoneSchema = new mongoose.Schema(
  {
    zoneName: {
      type: String,
      required: true,
      trim: true,
    },
    coverageArea: {
      type: String,
      required: true,
    },
    baseDeliveryFee: {
      type: Number,
      required: true,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const ShippingZone = mongoose.model('ShippingZone', shippingZoneSchema);

export default ShippingZone;
