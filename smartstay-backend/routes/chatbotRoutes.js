const express = require("express");
const router = express.Router();
const { sendChatbotMessage } = require("../controllers/chatbotController");
const { protect } = require("../middleware/authMiddleware");

router.post("/message", protect, sendChatbotMessage);

module.exports = router;
