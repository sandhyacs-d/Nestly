import mongoose from "mongoose";

const roommateRequestSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
    },
    message: {
        type: String,
        trim: true,
        maxlength: 1000,
    }
},
    {
        timestamps: true
    });

roommateRequestSchema.index(
    { sender: 1, recipient: 1 },
    { unique: true }
);

const RoommateRequest = mongoose.model("RoommateRequest", roommateRequestSchema);

export default RoommateRequest;