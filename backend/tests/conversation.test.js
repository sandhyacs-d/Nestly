
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import request from "supertest";

import app from "../app.js";
import User from "../models/user.js";
import RoommateRequest from "../models/roommateRequest.js";
import Conversation from "../models/conversation.js";

import {
    connectTestDB,
    clearTestDB,
    closeTestDB
} from "./setup.js";

let sender;
let recipient;
let outsider;

function createToken(user) {
    return jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
}

async function createRoommateRequest(status = "accepted") {
    return RoommateRequest.create({
        sender: sender._id,
        recipient: recipient._id,
        status,
        message: "Looking for a roommate."
    });
}

before(async () => {
    await connectTestDB();
});

beforeEach(async () => {
    await clearTestDB();

    sender = await User.create({
        name: "Sender",
        email: "sender@test.com",
        password: "test-password",
        role: "renter"
    });

    recipient = await User.create({
        name: "Recipient",
        email: "recipient@test.com",
        password: "test-password",
        role: "renter"
    });

    outsider = await User.create({
        name: "Outsider",
        email: "outsider@test.com",
        password: "test-password",
        role: "renter"
    });
});

after(async () => {
    await closeTestDB();
});


// CONVERSATION CREATION

test("creates a conversation for an accepted roommate request", async () => {
    const roommateRequest = await createRoommateRequest();

    const response = await request(app)
        .post(`/api/conversations/${roommateRequest._id}`)
        .set("Authorization", `Bearer ${createToken(sender)}`);

    assert.equal(response.status, 201);
    assert.equal(response.body.success, true);
    assert.equal(response.body.message, "Conversation created successfully");

    const conversation = response.body.data.conversation;

    assert.equal(
        conversation.roommateRequest,
        roommateRequest._id.toString()
    );

    assert.equal(conversation.participants.length, 2);

    const savedConversation = await Conversation.findOne({
        roommateRequest: roommateRequest._id
    });

    assert.ok(savedConversation);
});

test("recipient can create a conversation for an accepted request", async () => {
    const roommateRequest = await createRoommateRequest();

    const response = await request(app)
        .post(`/api/conversations/${roommateRequest._id}`)
        .set("Authorization", `Bearer ${createToken(recipient)}`);

    assert.equal(response.status, 201);
    assert.equal(response.body.success, true);
});

test("rejects conversation creation for a pending roommate request", async () => {
    const roommateRequest = await createRoommateRequest("pending");

    const response = await request(app)
        .post(`/api/conversations/${roommateRequest._id}`)
        .set("Authorization", `Bearer ${createToken(sender)}`);

    assert.equal(response.status, 403);

    const conversation = await Conversation.findOne({
        roommateRequest: roommateRequest._id
    });

    assert.equal(conversation, null);
});

test("rejects conversation creation for a rejected roommate request", async () => {
    const roommateRequest = await createRoommateRequest("rejected");

    const response = await request(app)
        .post(`/api/conversations/${roommateRequest._id}`)
        .set("Authorization", `Bearer ${createToken(sender)}`);

    assert.equal(response.status, 403);
});

test("rejects conversation creation by a non-participant", async () => {
    const roommateRequest = await createRoommateRequest();

    const response = await request(app)
        .post(`/api/conversations/${roommateRequest._id}`)
        .set("Authorization", `Bearer ${createToken(outsider)}`);

    assert.equal(response.status, 403);
});

test("rejects conversation creation without authentication", async () => {
    const roommateRequest = await createRoommateRequest();

    const response = await request(app)
        .post(`/api/conversations/${roommateRequest._id}`);

    assert.equal(response.status, 401);
});

test("rejects an invalid roommate request ID", async () => {
    const response = await request(app)
        .post("/api/conversations/invalid-id")
        .set("Authorization", `Bearer ${createToken(sender)}`);

    assert.equal(response.status, 400);
});

test("returns 404 when roommate request does not exist", async () => {
    const nonexistentId = "507f1f77bcf86cd799439011";

    const response = await request(app)
        .post(`/api/conversations/${nonexistentId}`)
        .set("Authorization", `Bearer ${createToken(sender)}`);

    assert.equal(response.status, 404);
});


// EXISTING CONVERSATION

test("retrieves an existing conversation instead of creating a duplicate", async () => {
    const roommateRequest = await createRoommateRequest();

    const firstResponse = await request(app)
        .post(`/api/conversations/${roommateRequest._id}`)
        .set("Authorization", `Bearer ${createToken(sender)}`);

    assert.equal(firstResponse.status, 201);

    const secondResponse = await request(app)
        .post(`/api/conversations/${roommateRequest._id}`)
        .set("Authorization", `Bearer ${createToken(recipient)}`);

    assert.equal(secondResponse.status, 200);
    assert.equal(
        secondResponse.body.message,
        "Conversation retrieved successfully"
    );

    assert.equal(
        secondResponse.body.data.conversation._id,
        firstResponse.body.data.conversation._id
    );

    const conversations = await Conversation.find({
        roommateRequest: roommateRequest._id
    });

    assert.equal(conversations.length, 1);
});

test("rejects access to an existing conversation by a non-participant", async () => {
    const roommateRequest = await createRoommateRequest();

    await request(app)
        .post(`/api/conversations/${roommateRequest._id}`)
        .set("Authorization", `Bearer ${createToken(sender)}`);

    const response = await request(app)
        .post(`/api/conversations/${roommateRequest._id}`)
        .set("Authorization", `Bearer ${createToken(outsider)}`);

    assert.equal(response.status, 403);
});

test("allows an existing conversation to be retrieved even if request status later changes", async () => {
    const roommateRequest = await createRoommateRequest();

    const firstResponse = await request(app)
        .post(`/api/conversations/${roommateRequest._id}`)
        .set("Authorization", `Bearer ${createToken(sender)}`);

    assert.equal(firstResponse.status, 201);

    roommateRequest.status = "rejected";
    await roommateRequest.save();

    const secondResponse = await request(app)
        .post(`/api/conversations/${roommateRequest._id}`)
        .set("Authorization", `Bearer ${createToken(sender)}`);

    assert.equal(secondResponse.status, 200);
    assert.equal(secondResponse.body.success, true);
});
