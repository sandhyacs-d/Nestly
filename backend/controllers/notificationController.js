
import mongoose from "mongoose";
import Notification from "../models/notification.js";
import { AppError } from "../errors/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export async function getNotifications(req, res) {
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 20;

    if (page < 1 || limit < 1 || limit > 50) {
        throw new AppError(
            "Page must be at least 1 and limit must be between 1 and 50",
            400
        );
    }

    const filter = { recipient: req.user._id };

    const [notifications, total] = await Promise.all([
        Notification.find(filter)
            .populate("relatedUser", "name")
            .populate("relatedProperty", "title")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
        Notification.countDocuments(filter)
    ]);

    return res.status(200).json({
        success: true,
        results: notifications.length,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        },
        data: { notifications }
    });
};


export async function markNotificationAsRead(req, res){
    const { notificationId } = req.params;

    if (!mongoose.isValidObjectId(notificationId)) {
        throw new AppError("Invalid notification ID", 400);
    }

    const notification = await Notification.findOneAndUpdate(
        {
            _id: notificationId,
            recipient: req.user._id
        },
        {
            isRead: true
        },
        {
            returnDocument:"after",
            runValidators: true
        }
    );

    if (!notification) {
        throw new AppError("Notification not found", 404);
    }

    return res.status(200).json({
        success: true,
        message: "Notification marked as read",
        data: { notification }
    });
};


