const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // never return password by default
    },
    role: {
      type: String,
      enum: ["student", "admin", "warden"],
      default: "student",
    },
    course: {
      type: String,
      enum: ["B.Tech", "MBA", "Diploma"],
      trim: true,
    },
    branch: {
      type: String,
      trim: true,
    },
    year: {
      type: Number,
      min: 1,
      max: 5,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    contactNumber: {
      type: String,
      trim: true,
    },
    profilePhoto: {
      type: String, // URL or file path
      default: "",
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    // Reference to the student's preference assessment
    preferences: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Preference",
    },
    // Set once admin finalizes allocation
    currentAllocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Allocation",
      default: null,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
