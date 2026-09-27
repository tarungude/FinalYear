const Preference = require("../models/Preference");
const User = require("../models/User");

// @route   POST /api/preferences
// @desc    Create or update the logged-in student's preference assessment
// @access  Private (student)
const submitPreferences = async (req, res) => {
  try {
    const {
      sleepSchedule,
      studyHabit,
      socialPreference,
      guestFrequency,
      cleanliness,
      noiseTolerance,
      budgetMin,
      budgetMax,
      interests,
      smoking,
      drinking,
      okWithSmokingRoommate,
      okWithDrinkingRoommate,
      additionalNotes,
    } = req.body;

    // Basic validation of required fields
    const requiredFields = {
      sleepSchedule,
      studyHabit,
      socialPreference,
      guestFrequency,
      cleanliness,
      noiseTolerance,
      budgetMin,
      budgetMax,
    };
    for (const [key, value] of Object.entries(requiredFields)) {
      if (value === undefined || value === null || value === "") {
        return res.status(400).json({ message: `Missing required field: ${key}` });
      }
    }

    if (Number(budgetMin) > Number(budgetMax)) {
      return res.status(400).json({ message: "budgetMin cannot be greater than budgetMax" });
    }

    const preferenceData = {
      user: req.user._id,
      sleepSchedule,
      studyHabit,
      socialPreference,
      guestFrequency,
      cleanliness,
      noiseTolerance,
      budgetMin,
      budgetMax,
      interests: interests || [],
      smoking: !!smoking,
      drinking: !!drinking,
      okWithSmokingRoommate: !!okWithSmokingRoommate,
      okWithDrinkingRoommate: !!okWithDrinkingRoommate,
      additionalNotes: additionalNotes || "",
    };

    // Upsert: create if doesn't exist, update if it does (findOneAndUpdate keeps it to one doc per student)
    const preference = await Preference.findOneAndUpdate(
      { user: req.user._id },
      preferenceData,
      { new: true, upsert: true, runValidators: true }
    );

    // Link the preference doc to the user and mark profile as completed
    await User.findByIdAndUpdate(req.user._id, {
      preferences: preference._id,
      profileCompleted: true,
    });

    res.status(200).json({ message: "Preferences saved successfully", preference });
  } catch (error) {
    res.status(500).json({ message: "Failed to save preferences", error: error.message });
  }
};

// @route   GET /api/preferences/me
// @desc    Get the logged-in student's own preferences
// @access  Private (student)
const getMyPreferences = async (req, res) => {
  try {
    const preference = await Preference.findOne({ user: req.user._id });
    if (!preference) {
      return res.status(404).json({ message: "No preferences submitted yet" });
    }
    res.json({ preference });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch preferences", error: error.message });
  }
};

// @route   GET /api/preferences/:userId
// @desc    Get a specific student's preferences (admin only)
// @access  Private (admin/warden)
const getPreferencesByUserId = async (req, res) => {
  try {
    const preference = await Preference.findOne({ user: req.params.userId });
    if (!preference) {
      return res.status(404).json({ message: "No preferences found for this student" });
    }
    res.json({ preference });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch preferences", error: error.message });
  }
};

module.exports = { submitPreferences, getMyPreferences, getPreferencesByUserId };
