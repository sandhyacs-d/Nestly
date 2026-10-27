
import User from "../models/user.js";
import mongoose from "mongoose";
import { getIO } from "../socket/io.js";
import { disconnectUserSockets } from "../socket/disconnectUserSocket.js";

export async function getAllUsers(req, res) {
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 20;

    if (page < 1 || limit < 1 || limit > 50) {
        return res.status(400).json({
            success: false,
            message: "Page must be at least 1 and limit must be between 1 and 50"
        });
    }

    const [users, total] = await Promise.all([
        User.find()
            .select("-password -passwordChangedAt")
            .sort({ _id: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        User.countDocuments()
    ]);

    return res.status(200).json({
        success: true,
        results: users.length,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        },
        data: { users }
    });
};

export async function getUserById(req, res) {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid user ID"
        });
    }

    const user = await User.findById(id)
        .select("-password -passwordChangedAt")
        .lean();

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        });
    }

    return res.status(200).json({
        success: true,
        data: { user }
    });
}

export async function updateUserRole(req, res) {
    const { id } = req.params;
    const { role } = req.body;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid user ID"
        });
    }

    const allowedRoles = ["renter", "owner"];

    if (!allowedRoles.includes(role)) {
        return res.status(400).json({
            success: false,
            message: "Role must be either renter or owner"
        });
    }

    const user = await User.findById(id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        });
    }

    user.role = role;
    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.passwordChangedAt;

    return res.status(200).json({
        success: true,
        message: "User role updated successfully",
        data: { user: safeUser }
    });
}


export async function setUserSuspensionStatus(req, res) {
    const { id } = req.params;
    const { isSuspended } = req.body;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid user ID"
        });
    }

    if (typeof isSuspended !== "boolean") {
        return res.status(400).json({
            success: false,
            message: "isSuspended must be a boolean"
        });
    }

    const user = await User.findById(id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        });
    }

    if (user.role === "admin") {
        return res.status(400).json({
            success: false,
            message: "Admin accounts cannot be suspended through this endpoint"
        });
    }

    user.isSuspended = isSuspended;
    await user.save();

    if (isSuspended) {
        const io = getIO();
        await disconnectUserSockets(io, user._id);
    }

    return res.status(200).json({
        success: true,
        message: isSuspended
            ? "User account suspended successfully"
            : "User account suspension lifted successfully",
        data: {
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                isSuspended: user.isSuspended
            }
        }
    });
}