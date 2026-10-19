import dotenv from "dotenv";
import app from "./app.js";
import { connectdb } from "./config/db.js";
import { Server } from "socket.io";
import { socketAuth } from "./middleware/socketAuth.js";

import { createServer } from "node:http";

dotenv.config({ path: "../.env" });

const httpServer = createServer(app);

const io = new Server(httpServer);

io.use(socketAuth);

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});



await connectdb();

httpServer.listen(3000,()=>{
    console.log("Server is running");
});