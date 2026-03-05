import mongoose from 'mongoose';

const passwordChangeRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    email: { type: String, required: true },
    tokenHash: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'expired', 'used'],
      default: 'pending',
      index: true
    },
    requestIp: { type: String, default: '' },
    redirectOrigin: { type: String, default: '' },
    redirectPath: { type: String, default: '' },
    expiresAt: { type: Date, required: true, index: true },
    confirmedAt: { type: Date },
    confirmedUntil: { type: Date },
    usedAt: { type: Date },
    alertSent: { type: Boolean, default: false }
  },
  { versionKey: false, timestamps: true }
);

export const PasswordChangeRequest = mongoose.model('PasswordChangeRequest', passwordChangeRequestSchema);
