
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import request from "supertest";
import { setIO, clearIO } from "../socket/io.js";

import app from "../app.js";
import User from "../models/user.js";
import RoommateRequest from "../models/roommateRequest.js";
import Conversation from "../models/conversation.js";
import Message from "../models/message.js";

import {
    connectTestDB,
    clearTestDB,
    closeTestDB
} from "./setup.js";

let sender;
let recipient;
let outsider;
let conversation;
let senderToken;
let recipientToken;
let outsiderToken;
let emittedEvents = [];

function createToken(user) {
    return jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
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

    setIO({
        to(roomId) {
            return {
                emit(eventName, payload) {
                    emittedEvents.push({
                        roomId,
                        eventName,
                        payload
                    });
                }
            };
        }
    });
});

beforeEach(async () => {
    emittedEvents = [];

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
    clearIO();
    await closeTestDB();
});

test("should send a message successfully", async () => {
    const response = await request(app)
        .post(`/api/conversations/${conversation._id}/messages`)
        .set("Authorization", `Bearer ${senderToken}`)
        .send({ content: "Hello there!" });

    assert.equal(response.status, 201);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.message.content, "Hello there!");
    assert.equal(
        response.body.data.message.sender.toString(),
        sender._id.toString()
    );

    const message = await Message.findById(
        response.body.data.message._id
    );

    assert.ok(message);
});

test("should broadcast REST-sent messages to the conversation room", async () => {
    const response = await request(app)
        .post(`/api/conversations/${conversation._id}/messages`)
        .set("Authorization", `Bearer ${senderToken}`)
        .send({ content: "REST broadcast test" });

    assert.equal(response.status, 201);
    assert.equal(emittedEvents.length, 1);

    assert.equal(
        emittedEvents[0].roomId,
        conversation._id.toString()
    );

    assert.equal(emittedEvents[0].eventName, "message:new");

    assert.equal(
        emittedEvents[0].payload.message._id.toString(),
        response.body.data.message._id
    );
});

test("should not broadcast a message from a non-participant", async () => {
    const response = await request(app)
        .post(`/api/conversations/${conversation._id}/messages`)
        .set("Authorization", `Bearer ${outsiderToken}`)
        .send({ content: "Unauthorized message" });

    assert.equal(response.status, 403);
    assert.equal(emittedEvents.length, 0);
});

test("should trim whitespace from message content", async () => {
    const response = await request(app)
        .post(`/api/conversations/${conversation._id}/messages`)
        .set("Authorization", `Bearer ${senderToken}`)
        .send({ content: "  Hello there!  " });

    assert.equal(response.status, 201);
    assert.equal(response.body.data.message.content, "Hello there!");
});

test("should allow the other participant to send a message", async () => {
    const response = await request(app)
        .post(`/api/conversations/${conversation._id}/messages`)
        .set("Authorization", `Bearer ${recipientToken}`)
        .send({ content: "Hello back!" });

    assert.equal(response.status, 201);
    assert.equal(response.body.data.message.content, "Hello back!");
});

test("should reject a message without authentication", async () => {
    const response = await request(app)
        .post(`/api/conversations/${conversation._id}/messages`)
        .send({ content: "Hello!" });

    assert.equal(response.status, 401);
});

test("should reject messages from a non-participant", async () => {
    const response = await request(app)
        .post(`/api/conversations/${conversation._id}/messages`)
        .set("Authorization", `Bearer ${outsiderToken}`)
        .send({ content: "Hello!" });

    assert.equal(response.status, 403);
});

test("should reject an invalid conversation ID", async () => {
    const response = await request(app)
        .post("/api/conversations/invalid-id/messages")
        .set("Authorization", `Bearer ${senderToken}`)
        .send({ content: "Hello!" });

    assert.equal(response.status, 400);
});

test("should return 404 when the conversation does not exist", async () => {
    const nonexistentId = "507f1f77bcf86cd799439011";

    const response = await request(app)
        .post(`/api/conversations/${nonexistentId}/messages`)
        .set("Authorization", `Bearer ${senderToken}`)
        .send({ content: "Hello!" });

    assert.equal(response.status, 404);
});

test("should reject empty message content", async () => {
    const response = await request(app)
        .post(`/api/conversations/${conversation._id}/messages`)
        .set("Authorization", `Bearer ${senderToken}`)
        .send({ content: "" });

    assert.equal(response.status, 400);
});

test("should reject whitespace-only message content", async () => {
    const response = await request(app)
        .post(`/api/conversations/${conversation._id}/messages`)
        .set("Authorization", `Bearer ${senderToken}`)
        .send({ content: "     " });

    assert.equal(response.status, 400);
});

test("should reject non-string message content", async () => {
    const response = await request(app)
        .post(`/api/conversations/${conversation._id}/messages`)
        .set("Authorization", `Bearer ${senderToken}`)
        .send({ content: 123 });

    assert.equal(response.status, 400);
});

test("should reject messages exceeding 2000 characters", async () => {
    const response = await request(app)
        .post(`/api/conversations/${conversation._id}/messages`)
        .set("Authorization", `Bearer ${senderToken}`)
        .send({ content: "a".repeat(2001) });

    assert.equal(response.status, 400);
});

test("should reject messages from a deactivated account", async () => {
    await User.findByIdAndUpdate(sender._id, {
        isActive: false
    });

    const response = await request(app)
        .post(`/api/conversations/${conversation._id}/messages`)
        .set("Authorization", `Bearer ${senderToken}`)
        .send({ content: "Hello!" });

    assert.equal(response.status, 403);
});

test("should reject messages from a suspended account", async () => {
    await User.findByIdAndUpdate(sender._id, {
        isSuspended: true
    });

    const response = await request(app)
        .post(`/api/conversations/${conversation._id}/messages`)
        .set("Authorization", `Bearer ${senderToken}`)
        .send({ content: "Hello!" });

    assert.equal(response.status, 403);
});

test("should retrieve conversation message history", async () => {
    await Message.create([
        {
            conversation: conversation._id,
            sender: sender._id,
            content: "First message"
        },
        {
            conversation: conversation._id,
            sender: recipient._id,
            content: "Second message"
        }
    ]);

    const response = await request(app)
        .get(`/api/conversations/${conversation._id}/messages`)
        .set("Authorization", `Bearer ${senderToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.messages.length, 2);
    assert.equal(
        response.body.data.messages[0].content,
        "First message"
    );
    assert.equal(
        response.body.data.messages[1].content,
        "Second message"
    );
});

test("should reject message history access without authentication", async () => {
    const response = await request(app)
        .get(`/api/conversations/${conversation._id}/messages`);

    assert.equal(response.status, 401);
});

test("should reject message history access by a non-participant", async () => {
    const response = await request(app)
        .get(`/api/conversations/${conversation._id}/messages`)
        .set("Authorization", `Bearer ${outsiderToken}`);

    assert.equal(response.status, 403);
});

test("should reject an invalid conversation ID when retrieving messages", async () => {
    const response = await request(app)
        .get("/api/conversations/invalid-id/messages")
        .set("Authorization", `Bearer ${senderToken}`);

    assert.equal(response.status, 400);
});

test("should return 404 when retrieving messages from a nonexistent conversation", async () => {
    const nonexistentId = "507f1f77bcf86cd799439011";

    const response = await request(app)
        .get(`/api/conversations/${nonexistentId}/messages`)
        .set("Authorization", `Bearer ${senderToken}`);

    assert.equal(response.status, 404);
});

test("should paginate message history", async () => {
    const messages = Array.from({ length: 5 }, (_, index) => ({
        conversation: conversation._id,
        sender: sender._id,
        content: `Message ${index + 1}`
    }));

    await Message.create(messages);

    const response = await request(app)
        .get(`/api/conversations/${conversation._id}/messages?page=2&limit=2`)
        .set("Authorization", `Bearer ${senderToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.data.messages.length, 2);
    assert.equal(response.body.data.messages[0].content, "Message 3");
    assert.equal(response.body.data.messages[1].content, "Message 4");

    assert.deepEqual(response.body.data.pagination, {
        page: 2,
        limit: 2,
        totalMessages: 5,
        totalPages: 3
    });
});

test("should use default pagination values when query parameters are omitted", async () => {
    const response = await request(app)
        .get(`/api/conversations/${conversation._id}/messages`)
        .set("Authorization", `Bearer ${senderToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.data.pagination.page, 1);
    assert.equal(response.body.data.pagination.limit, 20);
});
