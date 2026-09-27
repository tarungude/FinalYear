const mongoose = require("mongoose");

const roommateRequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Optional link to the Match document this request was made from,
    // so admins can see the compatibility score behind a request.
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled"],
      default: "pending",
    },
    message: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    respondedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// A student shouldn't be able to spam duplicate pending requests to the same person
roommateRequestSchema.index({ sender: 1, receiver: 1, status: 1 });

module.exports = mongoose.model("RoommateRequest", roommateRequestSchema);
