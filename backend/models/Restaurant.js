import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const restaurantSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please add a restaurant name'],
    },
    description: {
      type: String,
    },
    address: {
      street: String,
      area: String,
      city: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    phone: {
      type: String,
    },
    logo_url: {
      type: String,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'closed', 'suspended'],
      default: 'pending',
    },
    openTime: {
      type: String, // HH:mm format
    },
    closeTime: {
      type: String, // HH:mm format
    },
    cuisines: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
restaurantSchema.index({ owner: 1 });
restaurantSchema.index({ status: 1 });
restaurantSchema.index({ rating: -1 });

// Plugins
restaurantSchema.plugin(mongoosePaginate);

const Restaurant = mongoose.model('Restaurant', restaurantSchema);
export default Restaurant;
