const mongoose = require("mongoose");

/*
  This schema directly mirrors the attributes used by the compatibility
  scoring algorithm (see utils/compatibilityEngine.js). If you add/remove
  an attribute here, update the WEIGHTS object and similarity functions
  in that file too.
*/

const preferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // --- Categorical attributes ---
    sleepSchedule: {
      type: String,
      enum: ["early_bird", "night_owl", "flexible"],
      required: true,
    },
    studyHabit: {
      type: String,
      enum: ["silent_study", "background_music", "group_study"],
      required: true,
    },
    socialPreference: {
      type: String,
      enum: ["introvert", "ambivert", "extrovert"],
      required: true,
    },
    guestFrequency: {
      type: String,
      enum: ["never", "occasional", "frequent"],
      required: true,
    },

    // --- Numeric (1-5 scale) attributes ---
    cleanliness: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    noiseTolerance: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },

    // --- Budget (numeric range) ---
    budgetMin: {
      type: Number,
      required: true,
    },
    budgetMax: {
      type: Number,
      required: true,
    },

    // --- Multi-select ---
    interests: {
      type: [String], // e.g. ["music", "sports", "gaming", "reading"]
      default: [],
    },

    // --- Hard filters (deal-breakers, not scored — used to exclude matches) ---
    smoking: {
      type: Boolean,
      default: false,
    },
    drinking: {
      type: Boolean,
      default: false,
    },
    okWithSmokingRoommate: {
      type: Boolean,
      default: false,
    },
    okWithDrinkingRoommate: {
      type: Boolean,
      default: false,
    },

    // Free-text, passed to Gemini for extra context (not scored numerically)
    additionalNotes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Preference", preferenceSchema);
