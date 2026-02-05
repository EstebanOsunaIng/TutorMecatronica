import mongoose from 'mongoose';

const teacherCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    createdByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isUsed: { type: Boolean, default: false },
    usedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

export const TeacherCode = mongoose.model('TeacherCode', teacherCodeSchema);
