const express = require("express");
const router = express.Router();
const {
  submitFeedback,
  getMyFeedback,
  getAllFeedbackForAdmin,
} = require("../controllers/feedbackController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/", protect, submitFeedback);
router.get("/me", protect, getMyFeedback);
router.get("/admin/all", protect, authorize("admin", "warden"), getAllFeedbackForAdmin);

module.exports = router;
