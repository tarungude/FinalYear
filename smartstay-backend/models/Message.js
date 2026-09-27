const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Sorted pair of the two user IDs, used to fetch a whole conversation
    // with a single indexed query regardless of who sent which message.
    conversationKey: {
      type: String,
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

messageSchema.statics.buildConversationKey = function (userIdA, userIdB) {
  return [String(userIdA), String(userIdB)].sort().join("_");
};

module.exports = mongoose.model("Message", messageSchema);
