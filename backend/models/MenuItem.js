import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const menuItemSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please add a menu item name'],
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
      min: 0,
    },
    discountPrice: {
      type: Number,
      default: null,
    },
    image_url: {
      type: String,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isVeg: {
      type: Boolean,
      default: false,
    },
    preparationTime: {
      type: Number, // in minutes
    },
    subtotal: {
      type: Number,
    },
    addOns: [
      {
        name: String,
        price: Number,
        required: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
menuItemSchema.index({ restaurant: 1 });
menuItemSchema.index({ category: 1 });
menuItemSchema.index({ isAvailable: 1 });

// Plugins
menuItemSchema.plugin(mongoosePaginate);

// Pre-save hook on MenuItem to auto-calculate subtotal if discountPrice exists
menuItemSchema.pre('save', function(next) {
  if (this.discountPrice) {
    this.subtotal = this.discountPrice;
  } else {
    this.subtotal = this.price;
  }
  next();
});

const MenuItem = mongoose.model('MenuItem', menuItemSchema);
export default MenuItem;
