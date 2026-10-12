
import mongoose from "mongoose";

const enquirySchema = new mongoose.Schema(
    {
        renter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        property: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Property",
            required: true
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected"],
            default: "pending"
        }
    },
    {
        timestamps: true
    }
);

enquirySchema.index(
    { renter: 1, property: 1 },
    { unique: true }
);

const Enquiry = mongoose.model("Enquiry", enquirySchema);

export default Enquiry;
