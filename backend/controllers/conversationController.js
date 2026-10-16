import mongoose from "mongoose";
import Conversation from "../models/conversation.js";
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