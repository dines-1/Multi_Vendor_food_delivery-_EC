import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';

// @desc    Get all conversations for user
// @route   GET /api/chat/conversations
// @access  Private
export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: { $in: [req.user.id] }
    })
    .populate('participants', 'name avatar role')
    .populate('lastMessage')
    .sort('-updatedAt');

    res.status(200).json({ success: true, data: conversations });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Send a message
// @route   POST /api/chat/messages
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { recipientId, text, orderId } = req.body;

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, recipientId] },
      relatedOrder: orderId || null
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, recipientId],
        relatedOrder: orderId
      });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user.id,
      text
    });

    conversation.lastMessage = message._id;
    await conversation.save();

    // Create notification for recipient
    await Notification.create({
      recipient: recipientId,
      sender: req.user.id,
      type: 'chat_message',
      title: 'New Message',
      message: text.substring(0, 50),
      relatedId: conversation._id
    });

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Get messages in a conversation
// @route   GET /api/chat/conversations/:id/messages
// @access  Private
export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ conversation: req.params.id })
      .sort('createdAt')
      .populate('sender', 'name avatar');

    res.status(200).json({ success: true, data: messages });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
