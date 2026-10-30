
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import request from "supertest";

import app from "../app.js";
import User from "../models/user.js";
import RoommateRequest from "../models/roommateRequest.js";

import {
    connectTestDB,
    clearTestDB,
    closeTestDB
} from "./setup.js";

process.env.JWT_SECRET;

let sender;
let recipient;
let anotherRenter;
let roommateRequest;

function createToken(user) {
    return jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
}

async function createScenario() {
    sender = await User.create({
        name: "Request Sender",
        email: "sender@test.com",
        password: "test-password",
        role: "renter"
    });

    recipient = await User.create({
        name: "Request Recipient",
        email: "recipient@test.com",
        password: "test-password",
        role: "renter"
    });

    anotherRenter = await User.create({
        name: "Another Renter",
        email: "another-renter@test.com",
        password: "test-password",
        role: "renter"
    });

    roommateRequest = await RoommateRequest.create({
        sender: sender._id,
        recipient: recipient._id,
        message: "Would you like to be roommates?"
    });
}

before(async () => {
    await connectTestDB();
});

beforeEach(async () => {
    await clearTestDB();
    await createScenario();
});

after(async () => {
    await closeTestDB();
});

test("recipient can accept a pending roommate request", async () => {
    const response = await request(app)
        .patch(`/api/roommate-requests/${roommateRequest._id}/status`)
        .set("Authorization", `Bearer ${createToken(recipient)}`)
        .send({ status: "accepted" });

    assert.equal(response.status, 200);
    assert.equal(response.body.data.request.status, "accepted");

    const savedRequest = await RoommateRequest.findById(roommateRequest._id);
    assert.equal(savedRequest.status, "accepted");
});

test("sender cannot update their own outgoing request", async () => {
    const response = await request(app)
        .patch(`/api/roommate-requests/${roommateRequest._id}/status`)
        .set("Authorization", `Bearer ${createToken(sender)}`)
        .send({ status: "accepted" });

    assert.equal(response.status, 404);
});

test("another renter cannot update a request they did not receive", async () => {
    const response = await request(app)
        .patch(`/api/roommate-requests/${roommateRequest._id}/status`)
        .set("Authorization", `Bearer ${createToken(anotherRenter)}`)
        .send({ status: "accepted" });

    assert.equal(response.status, 404);
});

test("an already processed roommate request cannot be updated again", async () => {
    await request(app)
        .patch(`/api/roommate-requests/${roommateRequest._id}/status`)
        .set("Authorization", `Bearer ${createToken(recipient)}`)
        .send({ status: "accepted" });

    const secondResponse = await request(app)
        .patch(`/api/roommate-requests/${roommateRequest._id}/status`)
        .set("Authorization", `Bearer ${createToken(recipient)}`)
        .send({ status: "rejected" });

    assert.equal(secondResponse.status, 409);

    const savedRequest = await RoommateRequest.findById(roommateRequest._id);
    assert.equal(savedRequest.status, "accepted");
});
