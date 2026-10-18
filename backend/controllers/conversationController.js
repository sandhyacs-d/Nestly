import mongoose from "mongoose";
import Conversation from "../models/conversation.js";
import Message from "../models/message.js";
import RoommateRequest from "../models/roommateRequest.js";
import { AppError } from "../errors/appError.js";

export async function getOrCreateConversation(req, res) {
    const { requestId } = req.params;

    if (!mongoose.isValidObjectId(requestId)) {
        throw new AppError("Invalid roommate request ID", 400);
    }

    const request = await RoommateRequest.findById(requestId);

    if (!request) {
        throw new AppError("Roommate request not found", 404);
    }

    const isParticipant =
        request.sender.toString() === req.user._id.toString() ||
        request.recipient.toString() === req.user._id.toString();

    if (!isParticipant) {
        throw new AppError(
            "You are not authorized to access this conversation",
            403
        );
    }

    const existingConversation = await Conversation.findOne({
        roommateRequest: requestId
    });

    if (existingConversation) {
        return res.status(200).json({
            success: true,
            message: "Conversation retrieved successfully",
            data: { conversation: existingConversation }
        });
    }

    if (request.status !== "accepted") {
        throw new AppError("A conversation can only be created for an accepted roommate request", 403);
    }

    let conversation;

    try {
        conversation = await Conversation.create({
            roommateRequest: request._id,
            participants: [request.sender, request.recipient]
        });
    } catch (error) {
        if (error.code !== 11000) {
            throw error;
        }

        conversation = await Conversation.findOne({
            roommateRequest: request._id
        });

        if (!conversation) {
            throw error;
        }

        return res.status(200).json({
            success: true,
            message: "Conversation retrieved successfully",
            data: { conversation }
        });
    }

    return res.status(201).json({
        success: true,
        message: "Conversation created successfully",
        data: { conversation }
    });
}

export async function sendMessage(req, res) {
    const { conversationId } = req.params;
    const { content } = req.body;


    if (!mongoose.isValidObjectId(conversationId)) {
        throw new AppError("Invalid conversation ID", 400);
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
        throw new AppError("Conversation not found", 404);
    }

    const isParticipant = conversation.participants.some(
        (participant) => participant.toString() === req.user._id.toString()
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
        throw new AppError(
            "Message cannot exceed 2000 characters",
            400
        );
    }


    const message = await Message.create({
        conversation: conversation._id,
        sender: req.user._id,
        content: content.trim()
    });


    return res.status(201).json({
        success: true,
        message: "Message sent successfully",
        data: { message }
    });
}

export async function getMessages(req, res) {
    const { conversationId } = req.params;

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    if (!mongoose.isValidObjectId(conversationId)) {
        throw new AppError("Invalid conversation ID", 400);
    }


    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
        throw new AppError("Conversation not found", 404);
    }

    const isParticipant = conversation.participants.some(
        (participant) => participant.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
        throw new AppError(
            "You are not authorized to access this conversation",
            403
        );
    }

    const [messages, totalMessages] = await Promise.all([
        Message.find({ conversation: conversationId })
            .sort({ createdAt: 1, _id: 1 })
            .skip(skip)
            .limit(limit),

        Message.countDocuments({ conversation: conversationId })
    ]);

    return res.status(200).json({
        success: true,
        message: "Messages retrieved successfully",
        data: {
            messages,
            pagination: {
                page,
                limit,
                totalMessages,
                totalPages: Math.ceil(totalMessages / limit)
            }
        }
    });
}




