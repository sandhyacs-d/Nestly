
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        type: {
            type: String,
            enum: [
                "roommate_request",
                "roommate_request_updated",
                "enquiry_received",
                "enquiry_updated"
            ],
            required: true
        },
        message: {
            type: String,
            required: true,
            trim: true
        },
        relatedUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        relatedProperty: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Property"
        },
        relatedRoommateRequest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RoommateRequest"
        },
        relatedEnquiry: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Enquiry"
        },
        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

notificationSchema.index({
    recipient: 1,
    isRead: 1,
    createdAt: -1
});

const Notification = mongoose.model(
    "Notification",
    notificationSchema
);

export default Notification;
