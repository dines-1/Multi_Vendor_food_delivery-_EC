import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const deliveryPersonSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    vehicle_type: {
      type: String,
      enum: ['bike', 'bicycle', 'scooter'],
      required: true,
    },
    license_plate: {
      type: String,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    current_location: {
      lat: Number,
      lng: Number,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'suspended'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
deliveryPersonSchema.index({ user: 1 }, { unique: true });
deliveryPersonSchema.index({ isAvailable: 1 });

// Plugins
deliveryPersonSchema.plugin(mongoosePaginate);

const DeliveryPerson = mongoose.model('DeliveryPerson', deliveryPersonSchema);
export default DeliveryPerson;
