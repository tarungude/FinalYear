const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: true,
    },
    block: {
      type: String,
      required: true,
    },
    floor: {
      type: Number,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    currentOccupancy: {
      type: Number,
      default: 0,
    },
    occupants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    amenities: {
      type: [String], // e.g. ["attached_bathroom", "ac", "balcony"]
      default: [],
    },
    monthlyRent: {
      type: Number,
      required: true,
    },
    // Fee structure — the amount above (monthlyRent) is billed according to this cycle
    feeType: {
      type: String,
      enum: ["monthly", "yearly", "semester"],
      default: "monthly",
    },
    genderRestriction: {
      type: String,
      enum: ["male", "female", "any"],
      default: "any",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

roomSchema.virtual("isFull").get(function () {
  return this.currentOccupancy >= this.capacity;
});

roomSchema.virtual("availableSlots").get(function () {
  return this.capacity - this.currentOccupancy;
});

roomSchema.set("toJSON", { virtuals: true });
roomSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Room", roomSchema);
