
import { io } from "socket.io-client";

const token = process.env.TEST_JWT;
const conversationId = process.env.TEST_CONVERSATION_ID;

if (!token || !conversationId) {
    throw new Error("Set TEST_JWT and TEST_CONVERSATION_ID first.");
}

console.log("Starting unauthorized message test...");

const socket = io("http://localhost:3000", {
    auth: { token },
    autoConnect: false,
    timeout: 5000
});

let sendAttempted = false;

socket.on("connect", () => {
    console.log("Connected successfully:", socket.id);
    socket.emit("conversation:join", conversationId);
});

socket.on("conversation:error", (data) => {
    console.log("Join rejected:", data.message);

    if (sendAttempted) return;
    sendAttempted = true;

    console.log("Attempting to send message anyway...");

    socket.emit("message:send", {
        conversationId,
        content: "This unauthorized message must not be saved."
    });
});

socket.on("message:error", (data) => {
    console.log("Message correctly rejected:", data.message);
    socket.disconnect();
});

socket.on("message:new", (data) => {
    console.error("Unexpected message broadcast:", data.message);
    socket.disconnect();
});

socket.on("connect_error", (error) => {
    console.error("Connection rejected:", error.message);
    socket.disconnect();
});

socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
});

// Detect a missing error response rather than waiting indefinitely.
const timeout = setTimeout(() => {
    if (socket.connected) {
        console.error("Test inconclusive: no message:error response received.");
        socket.disconnect();
    }
}, 5000);

socket.on("disconnect", () => clearTimeout(timeout));

socket.connect();



