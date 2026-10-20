import mongoose from "mongoose";
import Conversation from "../models/conversation.js";

export function registerConversationHandler(io, socket) {
    socket.on("conversation:join", async (conversationId) => {
        try {
            if (!mongoose.isValidObjectId(conversationId)) {
                return socket.emit("conversation:error", {
                    message: "Invalid conversation ID"
                });
            }

            const conversation = await Conversation.findById(conversationId);

            if (!conversation) {
                return socket.emit("conversation:error", {
                    message: "Conversation not found"
                });
            }

            const isParticipant = conversation.participants.some((participant) => participant.toString() === socket.data.userId);

            if (!isParticipant) {
                return socket.emit("conversation:error", {
                    message: "You are not authorized to join this conversation"
                });
            }

            const roomId = conversation._id.toString();
            socket.join(roomId);

            return socket.emit("conversation:joined", {
                conversationId: roomId
            });

        } catch (error) {

            console.error("Failed to join conversation:", error);

            return socket.emit("conversation:error", {
                message: "Unable to join conversation"
            });

        }

    });
};