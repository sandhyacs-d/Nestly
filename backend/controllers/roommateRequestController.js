import mongoose from "mongoose";
import RoommateRequest from "../models/roommateRequest.js";
import RoommateProfile from "../models/roommateProfile.js";
import { AppError } from "../errors/appError.js";
import { asyncHandler }from "../utils/asyncHandler.js";

export const createRoommateRequest = asyncHandler(async (req, res) => {
    const { recipientId } = req.params;
    const { message } = req.body;

    
    if (req.user.role !== "renter") {
        throw new AppError("Only renters can send roommate requests",403);
    }

    
    if (!mongoose.isValidObjectId(recipientId)) {
        throw new AppError("Invalid recipient ID", 400);
    }

    if (recipientId === req.user._id.toString()) {
        throw new AppError(
            "You cannot send a roommate request to yourself",400);
    }


    if (message !== undefined) {
        if (
            typeof message !== "string" ||
            !message.trim() ||
            message.trim().length > 1000
        ) {
            throw new AppError("Message must be a non-empty string of at most 1000 characters",400);
        }
    }

    const recipientProfile = await RoommateProfile.findOne({
        user: recipientId,
        isActive: true
    });

    if (!recipientProfile) {
        throw new AppError("Recipient does not have an active roommate profile",404);
    }

    const existingRequest = await RoommateRequest.findOne({
        sender: req.user._id,
        recipient: recipientId
    });

    if (existingRequest) {
        throw new AppError("You have already sent a request to this renter",409);
    }

    try {
        const roommateRequest = await RoommateRequest.create({
            sender: req.user._id,
            recipient: recipientId,
            ...(message !== undefined && {
                message: message.trim()
            })
        });

        return res.status(201).json({
            success: true,
            message: "Roommate request sent successfully",
            data: { roommateRequest }
        });
        
    } catch (error) {
        
        if (error.code === 11000) {
            throw new AppError("You have already sent a request to this renter",409);
        }

        throw error;
    }
});