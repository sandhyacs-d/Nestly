
import mongoose from "mongoose";

const roommateProfileSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        bio: {
            type: String,
            trim: true,
            maxlength: 500
        },
        preferredLocation: {
            type: String,
            required: true,
            trim: true
        },
        budgetMin: {
            type: Number,
            required: true,
            min: 0
        },
        budgetMax: {
            type: Number,
            required: true,
            min: 0,
            validate: {
                validator: function (value) {
                    return value >= this.budgetMin;
                },
                message: "Maximum budget must be greater than or equal to minimum budget"
            }
        },
        occupation: {
            type: String,
            trim: true
        },
        lifestyle: {
            type: [String],
            default: []
        },
        moveInDate: {
            type: Date
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

roommateProfileSchema.index({ user: 1 }, { unique: true });

const RoommateProfile = mongoose.model("RoommateProfile",roommateProfileSchema);

export default RoommateProfile;
