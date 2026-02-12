import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['quiz', 'exercise', 'upload', 'mixed'], default: 'exercise' },
    questions: { type: Array, default: [] },
    passingScore: { type: Number, default: 0 }
  },
  { _id: false }
);

const lessonLevelSchema = new mongoose.Schema(
  {
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
    order: { type: Number, required: true },
    levelNumber: { type: Number, default: 1 },
    sublevelNumber: { type: Number, default: 1 },
    levelTitle: { type: String, default: '' },
    title: { type: String, required: true },
    contentText: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    resources: { type: [String], default: [] },
    imageItems: {
      type: [
        new mongoose.Schema(
          {
            url: { type: String, default: '' },
            context: { type: String, default: '' }
          },
          { _id: false }
        )
      ],
      default: []
    },
    activity: { type: activitySchema, default: () => ({}) },
    contextForAI: { type: String, default: '' }
  },
  { timestamps: true, versionKey: false }
);

export const LessonLevel = mongoose.model('LessonLevel', lessonLevelSchema);
