const Message = require("../models/Message");
const RoommateRequest = require("../models/RoommateRequest");
const Allocation = require("../models/Allocation");
const User = require("../models/User");

/**
 * Two students are allowed to message each other only if:
 *   - they have an accepted RoommateRequest between them (either direction), OR
 *   - they are roommates in the same active Allocation
 * This keeps chat scoped to people who've actually matched, rather than
 * open messaging between any two students on the platform.
 */
const canMessage = async (userIdA, userIdB) => {
  const acceptedRequest = await RoommateRequest.findOne({
    status: "accepted",
    $or: [
      { sender: userIdA, receiver: userIdB },
      { sender: userIdB, receiver: userIdA },
    ],
  });
  if (acceptedRequest) return true;

  const sharedAllocation = await Allocation.findOne({
    status: "active",
    students: { $all: [userIdA, userIdB] },
  });
  return !!sharedAllocation;
};

// @route   POST /api/messages
// @desc    Send a message to a matched student
// @access  Private (student)
const sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;

    if (!receiverId || !content?.trim()) {
      return res.status(400).json({ message: "receiverId and content are required" });
    }

    if (String(receiverId) === String(req.user._id)) {
      return res.status(400).json({ message: "You cannot message yourself" });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    const allowed = await canMessage(req.user._id, receiverId);
    if (!allowed) {
      return res.status(403).json({
        message: "You can only message students you've matched with (accepted request or shared room)",
      });
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      conversationKey: Message.buildConversationKey(req.user._id, receiverId),
      content: content.trim(),
    });

    res.status(201).json({ message: "Sent", data: message });
  } catch (error) {
    res.status(500).json({ message: "Failed to send message", error: error.message });
  }
};

// @route   GET /api/messages/:otherUserId
// @desc    Get the full conversation with another student, marks their messages as read
// @access  Private (student, must be an eligible contact)
const getConversation = async (req, res) => {
  try {
    const { otherUserId } = req.params;

    const allowed = await canMessage(req.user._id, otherUserId);
    if (!allowed) {
      return res.status(403).json({ message: "You can only view conversations with matched students" });
    }

    const conversationKey = Message.buildConversationKey(req.user._id, otherUserId);

    const messages = await Message.find({ conversationKey }).sort({ createdAt: 1 });

    // Mark messages sent TO the current user as read
    await Message.updateMany(
      { conversationKey, receiver: req.user._id, read: false },
      { read: true }
    );

    res.json({ count: messages.length, messages });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch conversation", error: error.message });
  }
};

// @route   GET /api/messages
// @desc    List all eligible contacts (accepted matches + roommates) with last message preview
// @access  Private (student)
const getConversationsList = async (req, res) => {
  try {
    const myId = req.user._id;

    const acceptedRequests = await RoommateRequest.find({
      status: "accepted",
      $or: [{ sender: myId }, { receiver: myId }],
    }).populate("sender receiver", "name email");

    const myAllocation = await Allocation.findOne({ status: "active", students: myId }).populate(
      "students",
      "name email"
    );

    const contactsMap = {};

    acceptedRequests.forEach((r) => {
      const other = String(r.sender._id) === String(myId) ? r.receiver : r.sender;
      contactsMap[String(other._id)] = other;
    });

    if (myAllocation) {
      myAllocation.students.forEach((s) => {
        if (String(s._id) !== String(myId)) {
          contactsMap[String(s._id)] = s;
        }
      });
    }

    const contacts = Object.values(contactsMap);

    // Attach last message + unread count for each contact
    const enriched = await Promise.all(
      contacts.map(async (contact) => {
        const conversationKey = Message.buildConversationKey(myId, contact._id);
        const lastMessage = await Message.findOne({ conversationKey }).sort({ createdAt: -1 });
        const unreadCount = await Message.countDocuments({
          conversationKey,
          receiver: myId,
          read: false,
        });
        return {
          contact: { id: contact._id, name: contact.name, email: contact.email },
          lastMessage: lastMessage
            ? { content: lastMessage.content, sentAt: lastMessage.createdAt, fromMe: String(lastMessage.sender) === String(myId) }
            : null,
          unreadCount,
        };
      })
    );

    // Most recent activity first
    enriched.sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.sentAt).getTime() : 0;
      const bTime = b.lastMessage ? new Date(b.lastMessage.sentAt).getTime() : 0;
      return bTime - aTime;
    });

    res.json({ count: enriched.length, conversations: enriched });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch conversations", error: error.message });
  }
};

module.exports = { sendMessage, getConversation, getConversationsList };
