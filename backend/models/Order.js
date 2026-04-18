import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
  },
  name: String, // snapshot
  unit_price: Number, // snapshot
  quantity: {
    type: Number,
    required: true,
  },
  subtotal: {
    type: Number,
    required: true,
  },
  special_notes: String,
});

const orderSchema = new mongoose.Schema(
  {
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
    delivery_person_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryPerson',
      default: null,
    },
    orderNumber: {
      type: String,
      unique: true,
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    delivery_fee: {
      type: Number,
      required: true,
    },
    total_amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['esewa', 'khalti', 'cash', 'card'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'pending',
    },
    delivery_address: {
      street: String,
      area: String,
      city: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    ordered_at: {
      type: Date,
      default: Date.now,
    },
    delivered_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
orderSchema.index({ customer: 1 });
orderSchema.index({ restaurant: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ ordered_at: -1 });
orderSchema.index({ orderNumber: 1 }, { unique: true });

// Plugins
orderSchema.plugin(mongoosePaginate);

// Static method to generate unique orderNumber
orderSchema.statics.generateOrderNumber = async function() {
  const date = new Date();
  const year = date.getFullYear();
  
  // Get count of orders this year
  const count = await this.countDocuments({
    ordered_at: {
      $gte: new Date(year, 0, 1),
      $lt: new Date(year + 1, 0, 1)
    }
  });
  
  const sequence = (count + 1).toString().padStart(5, '0');
  return `FD-${year}-${sequence}`;
};

const Order = mongoose.model('Order', orderSchema);
export default Order;
