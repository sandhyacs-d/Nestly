
import mongoose from "mongoose";
import Conversation from "../models/conversation.js";
import { verifySocketUser } from "./verifySocketUser.js";
import { createMessage } from "../services/messageService.js";

export function registerConversationHandler(io, socket) {
    socket.on("conversation:join", async (conversationId) => {
        try {

            const isAuthorized = await verifySocketUser(socket.data.userId);

            if (!isAuthorized) {
                socket.disconnect(true);
                return;
            }

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

            const isParticipant = conversation.participants.some(
                (participant) =>
                    participant.toString() === socket.data.userId
            );

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

    socket.on("message:send", async ({ conversationId, content } = {}) => {
        try {
            const message = await createMessage(
                conversationId,
                socket.data.userId,
                content
            );

            io.to(message.conversation.toString()).emit("message:new", {
                message
            });
        } catch (error) {
            console.error("Failed to send socket message:", error);

            socket.emit("message:error", {
                message: error.statusCode
                    ? error.message
                    : "Unable to send message"
            });
        }
    });
}
