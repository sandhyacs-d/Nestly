
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { io as ioClient } from "socket.io-client";

import app from "../app.js";
import User from "../models/user.js";
import RoommateRequest from "../models/roommateRequest.js";
import Conversation from "../models/conversation.js";
import Message from "../models/message.js";

import { socketAuth } from "../middleware/socketAuth.js";
import { registerConversationHandler } from "../socket/conversationSocket.js";

import {
    connectTestDB,
    clearTestDB,
    closeTestDB
} from "./setup.js";

let httpServer;
let ioServer;
let serverAddress;

let sender;
let recipient;
let outsider;

let conversation;
let senderToken;
let recipientToken;
let outsiderToken;

const clients = new Set();

function createToken(user, options = {}) {
    return jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "1h", ...options }
    );
}

function connectClient(token) {
    const client = ioClient(serverAddress, {
        auth: token ? { token } : {},
        transports: ["websocket"],
        reconnection: false
    });

    clients.add(client);

    return client;
}

function waitForEvent(socket, eventName) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            socket.off(eventName, handleEvent);
            reject(new Error(`Timed out waiting for ${eventName}`));
        }, 3000);

        function handleEvent(...args) {
            clearTimeout(timeout);
            resolve(args);
        }

        socket.once(eventName, handleEvent);
    });
}

function connectSuccessfully(client) {
    return new Promise((resolve, reject) => {
        client.once("connect", resolve);
        client.once("connect_error", reject);
    });
}

function expectConnectionError(client) {
    return new Promise((resolve, reject) => {
        client.once("connect_error", resolve);
        client.once("connect", () => {
            reject(new Error("Socket connected unexpectedly"));
        });
    });
}

async function joinConversation(client, conversationId) {
    const joinedPromise = waitForEvent(client, "conversation:joined");

    client.emit("conversation:join", conversationId);

    return joinedPromise;
}

async function createTestConversation() {
    const roommateRequest = await RoommateRequest.create({
        sender: sender._id,
        recipient: recipient._id,
        status: "accepted",
        message: "Looking for a roommate."
    });

    return Conversation.create({
        roommateRequest: roommateRequest._id,
        participants: [sender._id, recipient._id]
    });
}

before(async () => {
    await connectTestDB();

    httpServer = createServer(app);
    ioServer = new Server(httpServer);

    ioServer.use(socketAuth);

    ioServer.on("connection", async (socket) => {
        const userRoom = `user:${socket.data.userId}`;

        await socket.join(userRoom);

        registerConversationHandler(ioServer, socket);
    });

    await new Promise(resolve => {
        httpServer.listen(0, resolve);
    });

    const address = httpServer.address();
    serverAddress = `http://localhost:${address.port}`;
});

beforeEach(async () => {
    await clearTestDB();

    sender = await User.create({
        name: "Sender",
        email: "sender@test.com",
        password: "test-password"
    });

    recipient = await User.create({
        name: "Recipient",
        email: "recipient@test.com",
        password: "test-password"
    });

    outsider = await User.create({
        name: "Outsider",
        email: "outsider@test.com",
        password: "test-password"
    });

    senderToken = createToken(sender);
    recipientToken = createToken(recipient);
    outsiderToken = createToken(outsider);

    conversation = await createTestConversation();
});

after(async () => {
    for (const client of clients) {
        client.disconnect();
    }

    clients.clear();

    if (ioServer) {
        await new Promise(resolve => ioServer.close(resolve));
    }

    await closeTestDB();
});

test("should connect with a valid JWT", async () => {
    const client = connectClient(senderToken);

    await connectSuccessfully(client);

    assert.equal(client.connected, true);
});

test("should reject a connection without a token", async () => {
    const client = connectClient(null);

    const error = await expectConnectionError(client);

    assert.equal(error.message, "Authentication required");
});

test("should reject an invalid JWT", async () => {
    const client = connectClient("invalid-token");

    const error = await expectConnectionError(client);

    assert.equal(error.message, "Invalid or expired token");
});

test("should reject an expired JWT", async () => {
    const expiredToken = createToken(sender, {
        expiresIn: -1
    });

    const client = connectClient(expiredToken);

    const error = await expectConnectionError(client);

    assert.equal(error.message, "Invalid or expired token");
});

test("should reject a token belonging to a nonexistent user", async () => {
    const nonexistentToken = jwt.sign(
        { userId: "507f1f77bcf86cd799439011" },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );

    const client = connectClient(nonexistentToken);

    const error = await expectConnectionError(client);

    assert.equal(error.message, "Invalid or expired token");
});

test("should reject a connection from a deactivated account", async () => {
    await User.findByIdAndUpdate(sender._id, {
        isActive: false
    });

    const client = connectClient(senderToken);

    const error = await expectConnectionError(client);

    assert.equal(error.message, "Your account is deactivated.");
});

test("should reject a connection from a suspended account", async () => {
    await User.findByIdAndUpdate(sender._id, {
        isSuspended: true
    });

    const client = connectClient(senderToken);

    const error = await expectConnectionError(client);

    assert.equal(
        error.message,
        "Your account has been suspended. Please contact support."
    );
});

test("should reject a connection after the user's password has changed", async () => {
    await User.findByIdAndUpdate(sender._id, {
        passwordChangedAt: new Date(Date.now() + 1000)
    });

    const client = connectClient(senderToken);

    const error = await expectConnectionError(client);

    assert.equal(
        error.message,
        "Password changed. Please log in again."
    );
});

test("should allow a participant to join a conversation room", async () => {
    const client = connectClient(senderToken);

    await connectSuccessfully(client);

    const [result] = await joinConversation(
        client,
        conversation._id.toString()
    );

    assert.equal(
        result.conversationId,
        conversation._id.toString()
    );
});

test("should allow the other participant to join the conversation room", async () => {
    const client = connectClient(recipientToken);

    await connectSuccessfully(client);

    const [result] = await joinConversation(
        client,
        conversation._id.toString()
    );

    assert.equal(
        result.conversationId,
        conversation._id.toString()
    );
});

test("should reject an invalid conversation ID when joining", async () => {
    const client = connectClient(senderToken);

    await connectSuccessfully(client);

    const errorPromise = waitForEvent(client, "conversation:error");

    client.emit("conversation:join", "invalid-id");

    const [error] = await errorPromise;

    assert.equal(error.message, "Invalid conversation ID");
});

test("should reject joining a nonexistent conversation", async () => {
    const client = connectClient(senderToken);

    await connectSuccessfully(client);

    const errorPromise = waitForEvent(client, "conversation:error");

    client.emit(
        "conversation:join",
        "507f1f77bcf86cd799439011"
    );

    const [error] = await errorPromise;

    assert.equal(error.message, "Conversation not found");
});

test("should prevent a non-participant from joining a conversation room", async () => {
    const client = connectClient(outsiderToken);

    await connectSuccessfully(client);

    const errorPromise = waitForEvent(client, "conversation:error");

    client.emit(
        "conversation:join",
        conversation._id.toString()
    );

    const [error] = await errorPromise;

    assert.equal(
        error.message,
        "You are not authorized to join this conversation"
    );
});

test("should deliver a message to both conversation participants", async () => {
    const senderClient = connectClient(senderToken);
    const recipientClient = connectClient(recipientToken);

    await Promise.all([
        connectSuccessfully(senderClient),
        connectSuccessfully(recipientClient)
    ]);

    await Promise.all([
        joinConversation(senderClient, conversation._id.toString()),
        joinConversation(recipientClient, conversation._id.toString())
    ]);

    const senderMessage = waitForEvent(senderClient, "message:new");
    const recipientMessage = waitForEvent(recipientClient, "message:new");

    senderClient.emit("message:send", {
        conversationId: conversation._id.toString(),
        content: "Hello through Socket.IO!"
    });

    const [[senderResult], [recipientResult]] = await Promise.all([
        senderMessage,
        recipientMessage
    ]);

    assert.equal(
        senderResult.message.content,
        "Hello through Socket.IO!"
    );

    assert.equal(
        recipientResult.message._id.toString(),
        senderResult.message._id.toString()
    );

    const savedMessage = await Message.findById(
        senderResult.message._id
    );

    assert.ok(savedMessage);
});

test("should not deliver a conversation message to an outsider", async () => {
    const senderClient = connectClient(senderToken);
    const outsiderClient = connectClient(outsiderToken);

    await Promise.all([
        connectSuccessfully(senderClient),
        connectSuccessfully(outsiderClient)
    ]);

    await joinConversation(
        senderClient,
        conversation._id.toString()
    );

    const outsiderError = waitForEvent(
        outsiderClient,
        "message:error"
    );

    outsiderClient.emit("message:send", {
        conversationId: conversation._id.toString(),
        content: "Unauthorized message"
    });

    const [error] = await outsiderError;

    assert.equal(
        error.message,
        "You are not authorized to send messages in this conversation"
    );

    assert.equal(await Message.countDocuments(), 0);
});

test("should return an error when sending an empty message", async () => {
    const client = connectClient(senderToken);

    await connectSuccessfully(client);

    await joinConversation(
        client,
        conversation._id.toString()
    );

    const errorPromise = waitForEvent(client, "message:error");

    client.emit("message:send", {
        conversationId: conversation._id.toString(),
        content: "   "
    });

    const [error] = await errorPromise;

    assert.equal(error.message, "Message content is required");
    assert.equal(await Message.countDocuments(), 0);
});

test("should stop delivering messages after a participant disconnects", async () => {
    const senderClient = connectClient(senderToken);
    const recipientClient = connectClient(recipientToken);

    await Promise.all([
        connectSuccessfully(senderClient),
        connectSuccessfully(recipientClient)
    ]);

    await Promise.all([
        joinConversation(senderClient, conversation._id.toString()),
        joinConversation(recipientClient, conversation._id.toString())
    ]);

    recipientClient.disconnect();

    const messagePromise = waitForEvent(senderClient, "message:new");

    senderClient.emit("message:send", {
        conversationId: conversation._id.toString(),
        content: "After disconnect"
    });

    const [result] = await messagePromise;

    assert.equal(result.message.content, "After disconnect");
    assert.equal(await Message.countDocuments(), 1);
});
