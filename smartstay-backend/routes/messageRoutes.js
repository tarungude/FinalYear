const express = require("express");
const router = express.Router();
const {
  sendMessage,
  getConversation,
  getConversationsList,
} = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, sendMessage);
router.get("/", protect, getConversationsList);
router.get("/:otherUserId", protect, getConversation);

module.exports = router;
