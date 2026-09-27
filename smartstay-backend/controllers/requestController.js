const RoommateRequest = require("../models/RoommateRequest");
const User = require("../models/User");
const Match = require("../models/Match");

// @route   POST /api/requests
// @desc    Send a roommate request to another student
// @access  Private (student)
const sendRequest = async (req, res) => {
  try {
    const { receiverId, message } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: "receiverId is required" });
    }

    if (String(receiverId) === String(req.user._id)) {
      return res.status(400).json({ message: "You cannot send a request to yourself" });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver || receiver.role !== "student") {
      return res.status(404).json({ message: "Receiver not found" });
    }

    // Prevent duplicate pending requests between the same two students (either direction)
    const existingPending = await RoommateRequest.findOne({
      status: "pending",
      $or: [
        { sender: req.user._id, receiver: receiverId },
        { sender: receiverId, receiver: req.user._id },
      ],
    });

    if (existingPending) {
      return res.status(409).json({ message: "A pending request already exists between you two" });
    }

    // Look up the cached Match doc (if it exists) to link the compatibility score
    const [first, second] = [String(req.user._id), String(receiverId)].sort();
    const match = await Match.findOne({ studentA: first, studentB: second });

    const request = await RoommateRequest.create({
      sender: req.user._id,
      receiver: receiverId,
      match: match ? match._id : undefined,
      message: message || "",
    });

    res.status(201).json({ message: "Roommate request sent", request });
  } catch (error) {
    res.status(500).json({ message: "Failed to send request", error: error.message });
  }
};

// @route   GET /api/requests/received
// @desc    Requests sent TO the logged-in student
// @access  Private (student)
const getReceivedRequests = async (req, res) => {
  try {
    const requests = await RoommateRequest.find({ receiver: req.user._id })
      .populate("sender", "name email course year")
      .populate("match", "overallScore attributeBreakdown")
      .sort({ createdAt: -1 });

    res.json({ count: requests.length, requests });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch received requests", error: error.message });
  }
};

// @route   GET /api/requests/sent
// @desc    Requests sent BY the logged-in student
// @access  Private (student)
const getSentRequests = async (req, res) => {
  try {
    const requests = await RoommateRequest.find({ sender: req.user._id })
      .populate("receiver", "name email course year")
      .populate("match", "overallScore attributeBreakdown")
      .sort({ createdAt: -1 });

    res.json({ count: requests.length, requests });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch sent requests", error: error.message });
  }
};

// @route   PUT /api/requests/:id/respond
// @desc    Accept or reject a received request
// @access  Private (student, must be the receiver)
const respondToRequest = async (req, res) => {
  try {
    const { action } = req.body; // "accept" | "reject"

    if (!["accept", "reject"].includes(action)) {
      return res.status(400).json({ message: "action must be 'accept' or 'reject'" });
    }

    const request = await RoommateRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (String(request.receiver) !== String(req.user._id)) {
      return res.status(403).json({ message: "Only the receiver can respond to this request" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: `Request has already been ${request.status}` });
    }

    request.status = action === "accept" ? "accepted" : "rejected";
    request.respondedAt = new Date();
    await request.save();

    res.json({ message: `Request ${request.status}`, request });
  } catch (error) {
    res.status(500).json({ message: "Failed to respond to request", error: error.message });
  }
};

// @route   DELETE /api/requests/:id
// @desc    Cancel a request — works on a still-pending request (sender only) or
//          an already-accepted match (either student, to "unmatch" and remain
//          free to request/accept someone else before final admin allocation).
// @access  Private (student, must be sender or receiver)
const cancelRequest = async (req, res) => {
  try {
    const request = await RoommateRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    const isSender = String(request.sender) === String(req.user._id);
    const isReceiver = String(request.receiver) === String(req.user._id);

    if (!isSender && !isReceiver) {
      return res.status(403).json({ message: "You are not part of this request" });
    }

    if (request.status === "pending" && !isSender) {
      return res.status(403).json({ message: "Only the sender can cancel a pending request" });
    }

    if (!["pending", "accepted"].includes(request.status)) {
      return res.status(400).json({ message: "This request can no longer be cancelled" });
    }

    request.status = "cancelled";
    request.respondedAt = new Date();
    await request.save();

    res.json({ message: "Request cancelled", request });
  } catch (error) {
    res.status(500).json({ message: "Failed to cancel request", error: error.message });
  }
};

// @route   GET /api/requests/admin/all
// @desc    Admin view of all roommate requests (for oversight/analytics)
// @access  Private (admin/warden)
const getAllRequestsForAdmin = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const requests = await RoommateRequest.find(filter)
      .populate("sender", "name email")
      .populate("receiver", "name email")
      .populate("match", "overallScore")
      .sort({ createdAt: -1 })
      .limit(500);

    res.json({ count: requests.length, requests });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch requests", error: error.message });
  }
};

module.exports = {
  sendRequest,
  getReceivedRequests,
  getSentRequests,
  respondToRequest,
  cancelRequest,
  getAllRequestsForAdmin,
};
