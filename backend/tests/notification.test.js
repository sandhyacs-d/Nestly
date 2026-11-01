
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import request from "supertest";

import app from "../app.js";
import User from "../models/user.js";
import Property from "../models/property.js";
import Notification from "../models/notification.js";

import {
    connectTestDB,
    clearTestDB,
    closeTestDB
} from "./setup.js";

let recipient;
let anotherUser;
let recipientToken;
let anotherUserToken;
let notification;

function createToken(user) {
    return jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
}

async function createTestNotification(recipientId, overrides = {}) {
    return Notification.create({
        recipient: recipientId,
        type: "roommate_request",
        message: "You received a new roommate request",
        ...overrides
    });
}

before(async () => {
    await connectTestDB();
});

beforeEach(async () => {
    await clearTestDB();

    recipient = await User.create({
        name: "Notification Recipient",
        email: "recipient@example.com",
        password: "hashedpassword",
        role: "owner"
    });

    anotherUser = await User.create({
        name: "Another User",
        email: "another@example.com",
        password: "hashedpassword",
        role: "renter"
    });

    recipientToken = createToken(recipient);
    anotherUserToken = createToken(anotherUser);

    notification = await createTestNotification(recipient._id);
});

after(async () => {
    await closeTestDB();
});

test("Authenticated user can retrieve their notifications", async () => {
    const response = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${recipientToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.results, 1);
    assert.equal(response.body.data.notifications.length, 1);
    assert.equal(
        response.body.data.notifications[0]._id,
        notification._id.toString()
    );
});

test("User cannot retrieve another user's notifications", async () => {
    const response = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${anotherUserToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.results, 0);
    assert.equal(response.body.data.notifications.length, 0);
});

test("Unauthenticated user cannot retrieve notifications", async () => {
    const response = await request(app)
        .get("/api/notifications");

    assert.equal(response.status, 401);
});

test("Notifications are returned with pagination", async () => {
    await createTestNotification(recipient._id, {
        message: "Second notification"
    });

    const response = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${recipientToken}`)
        .query({
            page: 1,
            limit: 1
        });

    assert.equal(response.status, 200);
    assert.equal(response.body.results, 1);
    assert.equal(response.body.pagination.page, 1);
    assert.equal(response.body.pagination.limit, 1);
    assert.equal(response.body.pagination.total, 2);
    assert.equal(response.body.pagination.totalPages, 2);
});

test("Notifications are returned newest first", async () => {
    await createTestNotification(recipient._id, {
        message: "Newer notification"
    });

    const response = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${recipientToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.data.notifications.length, 2);
    assert.equal(
        response.body.data.notifications[0].message,
        "Newer notification"
    );
});

test("Notification retrieval rejects invalid page numbers", async () => {
    const response = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${recipientToken}`)
        .query({ page: 0 });

    assert.equal(response.status, 400);
});

test("Notification retrieval rejects limits above 50", async () => {
    const response = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${recipientToken}`)
        .query({ limit: 51 });

    assert.equal(response.status, 400);
});

test("User can mark their notification as read", async () => {
    const response = await request(app)
        .patch(`/api/notifications/${notification._id}/read`)
        .set("Authorization", `Bearer ${recipientToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.message, "Notification marked as read");
    assert.equal(response.body.data.notification.isRead, true);

    const updatedNotification = await Notification.findById(notification._id);
    assert.equal(updatedNotification.isRead, true);
});

test("User cannot mark another user's notification as read", async () => {
    const response = await request(app)
        .patch(`/api/notifications/${notification._id}/read`)
        .set("Authorization", `Bearer ${anotherUserToken}`);

    assert.equal(response.status, 404);

    const unchangedNotification = await Notification.findById(notification._id);
    assert.equal(unchangedNotification.isRead, false);
});

test("Marking a nonexistent notification as read returns 404", async () => {
    const nonexistentId = new mongoose.Types.ObjectId();

    const response = await request(app)
        .patch(`/api/notifications/${nonexistentId}/read`)
        .set("Authorization", `Bearer ${recipientToken}`);

    assert.equal(response.status, 404);
});

test("Marking a notification with an invalid ID returns 400", async () => {
    const response = await request(app)
        .patch("/api/notifications/invalid-id/read")
        .set("Authorization", `Bearer ${recipientToken}`);

    assert.equal(response.status, 400);
});

test("Unauthenticated user cannot mark a notification as read", async () => {
    const response = await request(app)
        .patch(`/api/notifications/${notification._id}/read`);

    assert.equal(response.status, 401);
});

test("Marking an already-read notification as read succeeds", async () => {
    notification.isRead = true;
    await notification.save();

    const response = await request(app)
        .patch(`/api/notifications/${notification._id}/read`)
        .set("Authorization", `Bearer ${recipientToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.data.notification.isRead, true);
});

test("Notifications populate related user and property", async () => {
    const property = await Property.create({
        owner: recipient._id,
        title: "Test Apartment",
        description: "A comfortable apartment for testing purposes.",
        propertyType: "apartment",
        price: 25000,
        location: "Biratnagar",
        bedrooms: 2,
        bathrooms: 1
    });

    const relatedNotification = await createTestNotification(recipient._id, {
        relatedUser: anotherUser._id,
        relatedProperty: property._id
    });

    const response = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${recipientToken}`);

    assert.equal(response.status, 200);

    const populatedNotification = response.body.data.notifications.find(
        item => item._id === relatedNotification._id.toString()
    );

    assert.ok(populatedNotification);
    assert.equal(populatedNotification.relatedUser.name, anotherUser.name);
    assert.equal(populatedNotification.relatedProperty.title, property.title);
});
