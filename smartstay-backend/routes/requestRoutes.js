const express = require("express");
const router = express.Router();
const {
  sendRequest,
  getReceivedRequests,
  getSentRequests,
  respondToRequest,
  cancelRequest,
  getAllRequestsForAdmin,
} = require("../controllers/requestController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/", protect, sendRequest);
router.get("/received", protect, getReceivedRequests);
router.get("/sent", protect, getSentRequests);
router.put("/:id/respond", protect, respondToRequest);
router.delete("/:id", protect, cancelRequest);
router.get("/admin/all", protect, authorize("admin", "warden"), getAllRequestsForAdmin);

module.exports = router;
