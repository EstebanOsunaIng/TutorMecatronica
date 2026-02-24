import mongoose from 'mongoose';

const registerEmailVerificationSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    otpHash: { type: String, default: '' },
    status: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'EXPIRED'],
      default: 'EXPIRED',
      index: true
    },
    verifiedAt: { type: Date },
    expiresAt: { type: Date, default: () => new Date(0), index: true },
    attemptCount: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    resendCount: { type: Number, default: 0 },
    nextResendAt: { type: Date },
    lastSentAt: { type: Date },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    redirectOrigin: { type: String, default: '' }
  },
  { versionKey: false, timestamps: true }
);

export const RegisterEmailVerification = mongoose.model('RegisterEmailVerification', registerEmailVerificationSchema);
