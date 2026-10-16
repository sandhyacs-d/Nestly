import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    roommateRequest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RoommateRequest",
        required: true,
        unique: true
    },
    participants: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],
        validate: {
            validator: function (participants) {
                return participants.length === 2 &&
                    participants[0].toString() !== participants[1].toString();
            },
            message: "A conversation must have exactly two distinct participants."
        }
    },
},
    {
        timestamps: true
    }
);


const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;

