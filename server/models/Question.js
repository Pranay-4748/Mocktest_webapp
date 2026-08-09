import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: false,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    question: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
      minlength: [5, 'Question must be at least 5 characters'],
    },
    options: {
      type: [String],
      validate: {
        validator: (arr) => arr.length >= 2 && arr.length <= 6,
        message: 'Options must have between 2 and 6 items',
      },
      required: [true, 'Options are required'],
    },
    correctAnswer: {
      type: Number,
      required: [true, 'Correct answer index is required'],
      min: [0, 'Correct answer index must be >= 0'],
      validate: {
        validator: function (val) { return val < this.options.length; },
        message: 'Correct answer index exceeds options length',
      },
    },
    explanation: {
      type: String,
      trim: true,
      default: '',
    },
    marks: {
      type: Number,
      default: 1,
      min: [0, 'Marks cannot be negative'],
    },
    subject: {
      type: String,
      trim: true,
      default: '',
    },
    difficulty: {
      type: String,
      enum: {
        values: ['easy', 'medium', 'hard'],
        message: 'Difficulty must be easy, medium, or hard',
      },
      default: 'medium',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Question', questionSchema);
