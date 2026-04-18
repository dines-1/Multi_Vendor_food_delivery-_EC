import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import mongoosePaginate from 'mongoose-paginate-v2';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Please add a phone number'],
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      select: false,
    },
    role: {
      type: String,
      enum: ['customer', 'vendor', 'delivery', 'admin'],
      default: 'customer',
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
    avatar: {
      type: String,
      default: 'default-avatar.png',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    recentlyViewed: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true });
userSchema.index({ role: 1 });

// Plugins
userSchema.plugin(mongoosePaginate);

// Pre-save hook for password hashing
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
