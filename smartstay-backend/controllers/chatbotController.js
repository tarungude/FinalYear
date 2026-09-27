const { getChatbotReply } = require("../utils/geminiService");
const Allocation = require("../models/Allocation");

// @route   POST /api/chatbot/message
// @desc    Send a message to the hostel FAQ chatbot
// @access  Private (student)
const sendChatbotMessage = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ message: "message is required" });
    }

    // Cap history to the last 10 turns to keep prompts small and fast
    const trimmedHistory = Array.isArray(history) ? history.slice(-10) : [];

    // Give the bot light context about the student's own situation, so
    // "what's my room number" or "have I been allocated yet" work naturally.
    let userContext = { hasNoRoom: true };
    if (req.user.currentAllocation) {
      const allocation = await Allocation.findById(req.user.currentAllocation).populate("room");
      if (allocation?.room) {
        userContext = { roomNumber: allocation.room.roomNumber, block: allocation.room.block };
      }
    }

    let reply;
    try {
      reply = await getChatbotReply(trimmedHistory, message.trim(), userContext);
    } catch (aiError) {
      console.error("Chatbot Gemini call failed:", aiError.message);
      return res.status(200).json({
        reply: "Sorry, I'm having trouble responding right now. Please try again in a moment, or reach out to your hostel admin directly.",
        aiUnavailable: true,
      });
    }

    res.json({ reply });
  } catch (error) {
    res.status(500).json({ message: "Failed to get chatbot response", error: error.message });
  }
};

module.exports = { sendChatbotMessage };
