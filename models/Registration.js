import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  registrationType: {
    type: String,
    enum: ['CONFERENCE_ONLY', 'WORKSHOP_CONFERENCE', 'COMBO'],
    required: true
  },
  bookingPhase: {
    type: String,
    enum: ['EARLY_BIRD', 'REGULAR', 'SPOT'],
    required: true
  },
  basePrice: {
    type: Number,
    required: true
  },
  workshopPrice: {
    type: Number,
    default: 0
  },
  comboDiscount: {
    type: Number,
    default: 0
  },
  gst: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'FAILED'],
    default: 'PENDING'
  },
  lifetimeMembershipId: {
    type: String,
    sparse: true
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  registrationNumber: {
    type: String,
    unique: true
  }
}, {
  timestamps: true
});


registrationSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    this.registrationNumber = `AOA2024-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

export default mongoose.model('Registration', registrationSchema);