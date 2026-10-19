
import { io } from "socket.io-client";

const token = process.env.TEST_JWT;
const conversationId = process.env.TEST_CONVERSATION_ID;

if (!token || !conversationId) {
    throw new Error(
        "Set TEST_JWT and TEST_CONVERSATION_ID before running the test."
    );
}

console.log("Starting socket test...");

const socket = io("http://localhost:3000", {
    auth: { token },
    autoConnect: false,
    timeout: 5000
});

socket.on("connect", () => {
    console.log("Connected successfully:", socket.id);

    socket.emit("conversation:join", conversationId);
});

socket.on("conversation:joined", (data) => {
    console.log("Joined conversation:", data);
    socket.disconnect();
});

socket.on("conversation:error", (data) => {
    console.log("Conversation error:", data.message);
    socket.disconnect();
});

socket.on("connect_error", (error) => {
    console.log("Connection rejected:", error.message);
    socket.disconnect();
});

socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
});

socket.connect();

