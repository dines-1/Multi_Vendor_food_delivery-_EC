import mongoose from 'mongoose';
import Restaurant from './Restaurant.js';

const reviewSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
reviewSchema.index({ order: 1 }, { unique: true });
reviewSchema.index({ restaurant: 1 });

// Static method to calculate avg rating
reviewSchema.statics.calculateAverageRating = async function(restaurantId) {
  const stats = await this.aggregate([
    {
      $match: { restaurant: restaurantId }
    },
    {
      $group: {
        _id: '$restaurant',
        rating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await Restaurant.findByIdAndUpdate(restaurantId, {
      rating: Math.round(stats[0].rating * 10) / 10,
      totalReviews: stats[0].totalReviews
    });
  } else {
    await Restaurant.findByIdAndUpdate(restaurantId, {
      rating: 0,
      totalReviews: 0
    });
  }
};

// Call calculateAverageRating after save
reviewSchema.post('save', function() {
  this.constructor.calculateAverageRating(this.restaurant);
});

// Call calculateAverageRating before remove
reviewSchema.pre('remove', function() {
  this.constructor.calculateAverageRating(this.restaurant);
});

const Review = mongoose.model('Review', reviewSchema);
export default Review;
