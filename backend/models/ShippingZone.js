import mongoose from 'mongoose';

const shippingZoneSchema = new mongoose.Schema(
  {
    zoneName: {
      type: String,
      required: [true, 'Please add a zone name'],
      trim: true,
    },
    coverageArea: {
      type: String,
      required: [true, 'Please add a coverage area'],
      trim: true,
    },
    baseDeliveryFee: {
      type: Number,
      required: [true, 'Please add a base delivery fee'],
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const ShippingZone = mongoose.model('ShippingZone', shippingZoneSchema);
export default ShippingZone;
