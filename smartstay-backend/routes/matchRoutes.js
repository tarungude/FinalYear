const express = require("express");
const router = express.Router();
const {
  getRecommendationsForMe,
  getRoomRecommendationsForMe,
  getMatchOverview,
  getMatchExplanation,
} = require("../controllers/matchController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/recommendations", protect, getRecommendationsForMe);
router.get("/rooms-for-me", protect, getRoomRecommendationsForMe);
router.get("/overview", protect, authorize("admin", "warden"), getMatchOverview);
router.get("/:matchId/explanation", protect, getMatchExplanation);

module.exports = router;
