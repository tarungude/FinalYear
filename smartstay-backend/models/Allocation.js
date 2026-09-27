const mongoose = require("mongoose");

const allocationSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    allocatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // the admin/warden who approved this
      required: true,
    },
    // Average compatibility score among the allocated students, snapshotted
    // at allocation time — useful for analytics even if preferences change later.
    avgCompatibilityScore: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["active", "ended"],
      default: "active",
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Allocation", allocationSchema);
