const Feedback = require("../models/Feedback");
const Allocation = require("../models/Allocation");

// @route   POST /api/feedback
// @desc    Submit post-allocation feedback
// @access  Private (student)
const submitFeedback = async (req, res) => {
  try {
    const { satisfactionRating, comments, issueTags } = req.body;

    if (!satisfactionRating || satisfactionRating < 1 || satisfactionRating > 5) {
      return res.status(400).json({ message: "satisfactionRating (1-5) is required" });
    }

    if (!req.user.currentAllocation) {
      return res.status(400).json({ message: "You don't have an active allocation to give feedback on" });
    }

    // One feedback per allocation per student — update if it already exists
    const feedback = await Feedback.findOneAndUpdate(
      { student: req.user._id, allocation: req.user.currentAllocation },
      {
        student: req.user._id,
        allocation: req.user.currentAllocation,
        satisfactionRating,
        comments: comments || "",
        issueTags: issueTags || [],
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Feedback submitted", feedback });
  } catch (error) {
    res.status(500).json({ message: "Failed to submit feedback", error: error.message });
  }
};

// @route   GET /api/feedback/me
// @desc    The logged-in student's own feedback for their current allocation
// @access  Private (student)
const getMyFeedback = async (req, res) => {
  try {
    if (!req.user.currentAllocation) {
      return res.status(404).json({ message: "No active allocation" });
    }
    const feedback = await Feedback.findOne({
      student: req.user._id,
      allocation: req.user.currentAllocation,
    });
    if (!feedback) return res.status(404).json({ message: "No feedback submitted yet" });
    res.json({ feedback });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch feedback", error: error.message });
  }
};

// @route   GET /api/feedback/admin/all
// @desc    All feedback, for admin monitoring — flags rooms/students with recurring issues
// @access  Private (admin/warden)
const getAllFeedbackForAdmin = async (req, res) => {
  try {
    const filter = {};
    if (req.query.maxRating) filter.satisfactionRating = { $lte: Number(req.query.maxRating) };

    const feedback = await Feedback.find(filter)
      .populate("student", "name email")
      .populate({
        path: "allocation",
        populate: { path: "room", select: "roomNumber block" },
      })
      .sort({ createdAt: -1 })
      .limit(300);

    res.json({ count: feedback.length, feedback });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch feedback", error: error.message });
  }
};

module.exports = { submitFeedback, getMyFeedback, getAllFeedbackForAdmin };
