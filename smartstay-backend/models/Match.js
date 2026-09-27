const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    studentA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    studentB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    overallScore: {
      type: Number, // 0-100
      required: true,
    },
    attributeBreakdown: {
      sleepSchedule: Number,
      studyHabit: Number,
      socialPreference: Number,
      guestFrequency: Number,
      cleanliness: Number,
      noiseTolerance: Number,
      budget: Number,
      interests: Number,
    },
    // Gemini-generated explanation, cached so we don't call the API every time
    aiExplanation: {
      type: String,
      default: "",
    },
    aiConflictAreas: {
      type: [String],
      default: [],
    },
    aiTips: {
      type: [String],
      default: [],
    },
    aiGeneratedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Prevent duplicate match documents for the same pair (order-independent)
matchSchema.index({ studentA: 1, studentB: 1 }, { unique: true });

module.exports = mongoose.model("Match", matchSchema);
