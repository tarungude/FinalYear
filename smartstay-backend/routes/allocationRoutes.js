const express = require("express");
const router = express.Router();
const {
  createAllocation,
  getAllocations,
  getMyAllocation,
  endAllocation,
  updateAllocation,
} = require("../controllers/allocationController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/", protect, authorize("admin", "warden"), createAllocation);
router.get("/", protect, authorize("admin", "warden"), getAllocations);
router.get("/me", protect, getMyAllocation);
router.put("/:id", protect, authorize("admin", "warden"), updateAllocation);
router.delete("/:id", protect, authorize("admin", "warden"), endAllocation);

module.exports = router;
