
import app from "./app.js";
import { connectdb } from "./config/db.js";
import { Server } from "socket.io";
import { socketAuth } from "./middleware/socketAuth.js";
import { setIO } from "./socket/io.js";
import { registerConversationHandler } from "./socket/conversationSocket.js";

import { createServer } from "node:http";



const httpServer = createServer(app);

const io = new Server(httpServer);

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

httpServer.listen(3000, () => {
    console.log("Server is running");
});