const express = require("express");
const router = express.Router();
const {
  submitPreferences,
  getMyPreferences,
  getPreferencesByUserId,
} = require("../controllers/preferenceController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/", protect, submitPreferences);
router.get("/me", protect, getMyPreferences);
router.get("/:userId", protect, authorize("admin", "warden"), getPreferencesByUserId);

module.exports = router;
