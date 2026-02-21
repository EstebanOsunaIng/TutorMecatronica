import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['STUDENT', 'TEACHER', 'ADMIN'], required: true },
    name: { type: String, required: true },
    lastName: { type: String, required: true },
    document: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, default: '' },
    passwordHash: { type: String, required: true },
    profilePhotoUrl: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    lastLoginAt: { type: Date },
    lastSeenAt: { type: Date },
    isActive: { type: Boolean, default: true },
    badgesUnlocked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Badge' }],
    badgesCount: { type: Number, default: 0 },
    completedModulesCount: { type: Number, default: 0 },
    lastBadgeUnlockedAt: { type: Date },
    notificationsMuted: { type: Boolean, default: false },
    resetCodeHash: { type: String },
    resetCodeExpires: { type: Date },
    resetCodeAttempts: { type: Number, default: 0 },
    resetCodeLastSentAt: { type: Date }
  },
  { versionKey: false }
);

export const User = mongoose.model('User', userSchema);
