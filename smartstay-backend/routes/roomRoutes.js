const express = require("express");
const router = express.Router();
const {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
} = require("../controllers/roomController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/", protect, authorize("admin", "warden"), createRoom);
router.get("/", protect, getRooms);
router.get("/:id", protect, getRoomById);
router.put("/:id", protect, authorize("admin", "warden"), updateRoom);
router.delete("/:id", protect, authorize("admin", "warden"), deleteRoom);

module.exports = router;
