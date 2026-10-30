
import Enquiry from "../models/enquiry.js";
import Property from "../models/property.js";
import mongoose from "mongoose";
import { AppError } from "../errors/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createNotificationSafely } from "../services/notificationService.js";


export const createEnquiry = asyncHandler(async (req, res) => {
    const { propertyId } = req.params;
    const { message } = req.body;

    if (req.user.role !== "renter") {
        throw new AppError(
            "Only renters can submit property enquiries",
            403
        );
    }

    if (!mongoose.isValidObjectId(propertyId)) {
        throw new AppError("Invalid property ID", 400);
    }

    if (typeof message !== "string" || !message.trim()) {
        throw new AppError("Please provide an enquiry message", 400);
    }

    if (message.trim().length > 1000) {
        throw new AppError("Message cannot exceed 1000 characters", 400);
    }

    const property = await Property.findById(propertyId);

    if (!property) {
        throw new AppError("Property not found", 404);
    }

    if (property.status !== "active") {
        throw new AppError(
            "Cannot enquire about a property that is not active",
            400
        );
    }

    if (property.owner.toString() === req.user._id.toString()) {
        throw new AppError(
            "You cannot enquire about your own property",
            403
        );
    }

    const existingEnquiry = await Enquiry.findOne({
        renter: req.user._id,
        property: property._id
    });

    if (existingEnquiry) {
        throw new AppError(
            "You have already enquired about this property",
            409
        );
    }

    try {
        const enquiry = await Enquiry.create({
            renter: req.user._id,
            property: property._id,
            owner: property.owner,
            message: message.trim()
        });

        await createNotificationSafely({
            recipient: enquiry.owner,
            type: "enquiry_received",
            message: "You received a new property enquiry.",
            relatedUser: req.user._id,
            relatedProperty: property._id,
            relatedEnquiry: enquiry._id
        });

        return res.status(201).json({
            success: true,
            message: "Enquiry submitted successfully",
            data: { enquiry }
        });
    } catch (error) {
        if (error.code === 11000) {
            throw new AppError(
                "You have already enquired about this property",
                409
            );
        }

        throw error;
    }
});

export const getSentEnquiries = asyncHandler(async (req, res) => {
    const enquiries = await Enquiry.find({
        renter: req.user._id
    })
        .populate("property")
        .populate("owner", "name email")
        .sort({ createdAt: -1 });

    return res.status(200).json({
        success: true,
        count: enquiries.length,
        data: { enquiries }
    });
});

export const getReceivedEnquiries = asyncHandler(async (req, res) => {
    const enquiries = await Enquiry.find({
        owner: req.user._id
    })
        .populate("property")
        .populate("renter", "name email")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        results: enquiries.length,
        data: {
            enquiries
        }
    });
});






export const updateEnquiryStatus = asyncHandler(async (req, res) => {
    const { enquiryId } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(enquiryId)) {
        throw new AppError("Invalid enquiry ID", 400);
    }

    if (req.user.role !== "owner") {
        throw new AppError(
            "Only property owners can update enquiry status",
            403
        );
    }

    if (!["accepted", "rejected"].includes(status)) {
        throw new AppError(
            "Status must be either accepted or rejected",
            400
        );
    }

    const enquiry = await Enquiry.findOneAndUpdate(
        {
            _id: enquiryId,
            owner: req.user._id,
            status: "pending"
        },
        { $set: { status } },
        {
            returnDocument: "after",
            runValidators: true
        }
    );

    if (!enquiry) {
        const existingEnquiry = await Enquiry.findOne({
            _id: enquiryId,
            owner: req.user._id
        }).select("_id status");

        if (!existingEnquiry) {
            throw new AppError("Enquiry not found", 404);
        }

        throw new AppError(
            "This enquiry has already been processed",
            409
        );
    }

    await createNotificationSafely({
        recipient: enquiry.renter,
        type: "enquiry_updated",
        message: `Your property enquiry was ${status}.`,
        relatedUser: req.user._id,
        relatedProperty: enquiry.property,
        relatedEnquiry: enquiry._id
    });

    return res.status(200).json({
        success: true,
        message: "Enquiry status updated successfully",
        data: { enquiry }
    });
});

