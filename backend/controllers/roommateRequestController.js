import mongoose from "mongoose";
import RoommateRequest from "../models/roommateRequest.js";
import RoommateProfile from "../models/roommateProfile.js";
import { AppError } from "../errors/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createNotification } from "../services/notificationService.js";

export const createRoommateRequest = asyncHandler(async (req, res) => {
    const { recipientId } = req.params;
    const { message } = req.body;


    if (req.user.role !== "renter") {
        throw new AppError("Only renters can send roommate requests", 403);
    }


    if (!mongoose.isValidObjectId(recipientId)) {
        throw new AppError("Invalid recipient ID", 400);
    }

    if (recipientId === req.user._id.toString()) {
        throw new AppError(
            "You cannot send a roommate request to yourself", 400);
    }


    if (message !== undefined) {
        if (
            typeof message !== "string" ||
            !message.trim() ||
            message.trim().length > 1000
        ) {
            throw new AppError("Message must be a non-empty string of at most 1000 characters", 400);
        }
    }

    const recipientProfile = await RoommateProfile.findOne({
        user: recipientId,
        isActive: true
    });

    if (!recipientProfile) {
        throw new AppError("Recipient does not have an active roommate profile", 404);
    }

    const existingRequest = await RoommateRequest.findOne({
        sender: req.user._id,
        recipient: recipientId
    });

    if (existingRequest) {
        throw new AppError("You have already sent a request to this renter", 409);
    }

    try {
        const roommateRequest = await RoommateRequest.create({
            sender: req.user._id,
            recipient: recipientId,
            ...(message !== undefined && {
                message: message.trim()
            })
        });

        await createNotification({
            recipient: recipientId,
            type: "roommate_request",
            message: "You received a new roommate request.",
            relatedUser: req.user._id,
            relatedRoommateRequest: roommateRequest._id
        });

        return res.status(201).json({
            success: true,
            message: "Roommate request sent successfully",
            data: { roommateRequest }
        });

    } catch (error) {

        if (error.code === 11000) {
            throw new AppError("You have already sent a request to this renter", 409);
        }

        throw error;
    }
});

export const getReceivedRoommateRequests = asyncHandler(async (req, res) => {
    if (req.user.role !== "renter") {
        throw new AppError(
            "Only renters can view roommate requests",
            403
        );
    }

    const requests = await RoommateRequest.find({
        recipient: req.user._id
    })
        .populate("sender", "name")
        .sort({ createdAt: -1 });

    return res.status(200).json({
        success: true,
        results: requests.length,
        data: { requests }
    });
});

export const updateRoommateRequestStatus = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const { status } = req.body;


    if (!mongoose.isValidObjectId(requestId)) {
        throw new AppError("Invalid roommate request ID", 400);
    }

    if (req.user.role !== "renter") {
        throw new AppError(
            "Only renters can update roommate requests",
            403
        );
    }

    if (!["accepted", "rejected"].includes(status)) {
        throw new AppError(
            "Status must be either accepted or rejected",
            400
        );
    }

    const request = await RoommateRequest.findOne({
        _id: requestId,
        recipient: req.user._id
    });

    if (!request) {
        throw new AppError("Roommate Request not found", 404);
    }

    if (request.status !== "pending") {
        throw new AppError(
            "This request has already been processed",
            409
        );
    }

    request.status = status;
    await request.save();


    await createNotification({
        recipient: request.sender,
        type: "roommate_request_updated",
        message: `Your roommate request was ${status}.`,
        relatedUser: req.user._id,
        relatedRoommateRequest: request._id
    });


    return res.status(200).json({
        success: true,
        message: `Roommate request ${status} successfully`,
        data: { request }
    });

});

