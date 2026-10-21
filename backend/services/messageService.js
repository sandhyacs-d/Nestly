
import mongoose from "mongoose";
import Conversation from "../models/conversation.js";
import Message from "../models/message.js";
import { AppError } from "../errors/appError.js";

export async function createMessage(conversationId, senderId, content) {
    if (!mongoose.isValidObjectId(conversationId)) {
        throw new AppError("Invalid conversation ID", 400);
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
        throw new AppError("Conversation not found", 404);
    }

    const isParticipant = conversation.participants.some(
        (participant) => participant.toString() === senderId.toString()
    );

    if (!isParticipant) {
        throw new AppError(
            "You are not authorized to send messages in this conversation",
            403
        );
    }

    if (typeof content !== "string" || !content.trim()) {
        throw new AppError("Message content is required", 400);
    }

    if (content.trim().length > 2000) {
        throw new AppError("Message cannot exceed 2000 characters", 400);
    }

    const message = await Message.create({
        conversation: conversation._id,
        sender: senderId,
        content: content.trim()
    });

    return message;
}
