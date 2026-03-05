import mongoose from 'mongoose';
import {
  decryptFieldValue,
  encryptFieldValue,
  hashLookupValue,
  normalizeDocumentForLookup,
  normalizeEmailForLookup
} from '../utils/fieldCrypto.js';

function encryptedGetter(value) {
  return decryptFieldValue(value);
}

function encryptedSetter(value) {
  return encryptFieldValue(String(value ?? '').trim());
}

function encryptedEmailSetter(value) {
  return encryptFieldValue(normalizeEmailForLookup(value));
}

const userSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['STUDENT', 'TEACHER', 'ADMIN'], required: true },
    name: { type: String, required: true, get: encryptedGetter, set: encryptedSetter },
    lastName: { type: String, required: true, get: encryptedGetter, set: encryptedSetter },
    document: { type: String, required: true, get: encryptedGetter, set: encryptedSetter },
    documentHash: { type: String, index: true },
    email: { type: String, required: true, get: encryptedGetter, set: encryptedEmailSetter },
    emailHash: { type: String, required: true, unique: true, index: true },
    emailVerified: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: ['PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED'],
      default: 'PENDING_VERIFICATION',
      index: true
    },
    phone: { type: String, default: '', get: encryptedGetter, set: encryptedSetter },
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
    onboardingCompleted: { type: Boolean, default: false },
    onboardingSeenAt: { type: Date },
    onboardingVersion: { type: Number, default: 1 },
    resetCodeHash: { type: String },
    resetCodeExpires: { type: Date },
    resetCodeAttempts: { type: Number, default: 0 },
    resetCodeLastSentAt: { type: Date }
  },
  {
    versionKey: false,
    toJSON: { getters: true },
    toObject: { getters: true }
  }
);

userSchema.pre('validate', function setLookupHashes(next) {
  const safeEmail = normalizeEmailForLookup(this.email);
  this.emailHash = hashLookupValue(safeEmail);

  const safeDocument = normalizeDocumentForLookup(this.document);
  this.documentHash = safeDocument ? hashLookupValue(safeDocument) : '';

  next();
});

export const User = mongoose.model('User', userSchema);
