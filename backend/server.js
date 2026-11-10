
import app from "./app.js";
import { connectdb , disconnectdb } from "./config/db.js";
import { Server } from "socket.io";
import { socketAuth } from "./middleware/socketAuth.js";
import { setIO } from "./socket/io.js";
import { registerConversationHandler } from "./socket/conversationSocket.js";

import { createServer } from "node:http";



const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST"],
    },
});

setIO(io);

io.use(socketAuth);

io.on("connection", async (socket) => {
    console.log("User connected:", socket.id);

    const userRoom = `user:${socket.data.userId}`;

    await socket.join(userRoom);

    registerConversationHandler(io, socket);

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});



await connectdb();

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

let isShuttingDown = false;

async function shutdown(signal) {
    if (isShuttingDown) return;

    isShuttingDown = true;
    console.log(`${signal} received. Shutting down gracefully...`);

    io.close(async () => {
        try {
            await disconnectdb();
            console.log("MongoDB disconnected.");
            process.exit(0);
        } catch (error) {
            console.error("Error during shutdown:", error);
            process.exit(1);
        }
    });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));