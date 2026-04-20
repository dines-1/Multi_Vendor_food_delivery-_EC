import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const shippingZoneSchema = new mongoose.Schema(
  {
    zoneName: {
      type: String,
      required: true,
      trim: true,
    },
    coverageArea: {
      type: String,
      default: '',
    },
    baseDeliveryFee: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

shippingZoneSchema.plugin(mongoosePaginate);

const ShippingZone = mongoose.model('ShippingZone', shippingZoneSchema);
export default ShippingZone;
