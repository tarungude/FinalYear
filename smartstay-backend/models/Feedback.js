const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    allocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Allocation",
      required: true,
    },
    satisfactionRating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comments: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    // Optional flags so admins can spot recurring issue categories quickly
    issueTags: {
      type: [String], // e.g. ["noise", "cleanliness", "guests"]
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
