
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import request from "supertest";

import { createServer } from "node:http";
import { Server } from "socket.io";

import app from "../app.js";
import User from "../models/user.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { setIO, clearIO } from "../socket/io.js";

import {
    connectTestDB,
    clearTestDB,
    closeTestDB
} from "./setup.js";

let httpServer;
let io;

const originalPassword = "Password123";

async function createTestUser(overrides = {}) {
    const hashedPassword = await hashPassword(originalPassword);

    return User.create({
        name: "Test User",
        email: "test@example.com",
        password: hashedPassword,
        role: "renter",
        ...overrides
    });
}

function createToken(user) {
    return jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
}

before(async () => {
    await connectTestDB();

    httpServer = createServer(app);
    io = new Server(httpServer);

    setIO(io);

    await new Promise((resolve) => {
        httpServer.listen(0, resolve);
    });
});

beforeEach(async () => {
    await clearTestDB();
});

after(async () => {
    if (io) {
        await new Promise((resolve) => {
            io.close(resolve);
        });
    }

    clearIO();

    await closeTestDB();
});


// PROFILE UPDATE

test("user can update their name", async () => {
    const user = await createTestUser();
    const token = createToken(user);

    const response = await request(app)
        .patch("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated User" });

    assert.equal(response.status, 200);
    assert.equal(response.body.message, "Profile updated successfully");
    assert.equal(response.body.user.name, "Updated User");

    const updatedUser = await User.findById(user._id);

    assert.equal(updatedUser.name, "Updated User");
});

test("user can update their email", async () => {
    const user = await createTestUser();
    const token = createToken(user);

    const response = await request(app)
        .patch("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ email: "new@example.com" });

    assert.equal(response.status, 200);
    assert.equal(response.body.user.email, "new@example.com");

    const updatedUser = await User.findById(user._id);

    assert.equal(updatedUser.email, "new@example.com");
});

test("normalizes email during profile update", async () => {
    const user = await createTestUser();
    const token = createToken(user);

    const response = await request(app)
        .patch("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ email: "  NEW@EXAMPLE.COM  " });

    assert.equal(response.status, 200);
    assert.equal(response.body.user.email, "new@example.com");
});

test("rejects an email already used by another user", async () => {
    const user = await createTestUser();
    const token = createToken(user);

    await createTestUser({
        name: "Another User",
        email: "another@example.com"
    });

    const response = await request(app)
        .patch("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ email: "another@example.com" });

    assert.equal(response.status, 409);
});

test("rejects an invalid profile name", async () => {
    const user = await createTestUser();
    const token = createToken(user);

    const response = await request(app)
        .patch("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "A" });

    assert.equal(response.status, 400);
});

test("rejects an invalid profile email", async () => {
    const user = await createTestUser();
    const token = createToken(user);

    const response = await request(app)
        .patch("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ email: "invalid-email" });

    assert.equal(response.status, 400);
});

test("rejects empty profile updates", async () => {
    const user = await createTestUser();
    const token = createToken(user);

    const response = await request(app)
        .patch("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({});

    assert.equal(response.status, 400);
});

test("rejects attempts to update restricted profile fields", async () => {
    const user = await createTestUser();
    const token = createToken(user);

    const response = await request(app)
        .patch("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ role: "admin" });

    assert.equal(response.status, 400);

    const unchangedUser = await User.findById(user._id);

    assert.equal(unchangedUser.role, "renter");
});

test("rejects profile updates without authentication", async () => {
    const response = await request(app)
        .patch("/api/users/me")
        .send({ name: "Updated User" });

    assert.equal(response.status, 401);
});


// PASSWORD CHANGE

test("user can change their password with the correct current password", async () => {
    const user = await createTestUser();
    const token = createToken(user);

    const response = await request(app)
        .patch("/api/users/me/password")
        .set("Authorization", `Bearer ${token}`)
        .send({
            currentPassword: originalPassword,
            newPassword: "NewPassword123"
        });

    assert.equal(response.status, 200);
    assert.equal(response.body.message, "Password changed successfully");

    const updatedUser = await User.findById(user._id).select("+password");

    assert.equal(
        await verifyPassword("NewPassword123", updatedUser.password),
        true
    );

    assert.equal(
        await verifyPassword(originalPassword, updatedUser.password),
        false
    );

    assert.ok(updatedUser.passwordChangedAt);
});

test("rejects password change with an incorrect current password", async () => {
    const user = await createTestUser();
    const token = createToken(user);

    const response = await request(app)
        .patch("/api/users/me/password")
        .set("Authorization", `Bearer ${token}`)
        .send({
            currentPassword: "WrongPassword123",
            newPassword: "NewPassword123"
        });

    assert.equal(response.status, 401);
});

test("rejects a new password shorter than eight characters", async () => {
    const user = await createTestUser();
    const token = createToken(user);

    const response = await request(app)
        .patch("/api/users/me/password")
        .set("Authorization", `Bearer ${token}`)
        .send({
            currentPassword: originalPassword,
            newPassword: "short"
        });

    assert.equal(response.status, 400);
});

test("rejects a new password identical to the current password", async () => {
    const user = await createTestUser();
    const token = createToken(user);

    const response = await request(app)
        .patch("/api/users/me/password")
        .set("Authorization", `Bearer ${token}`)
        .send({
            currentPassword: originalPassword,
            newPassword: originalPassword
        });

    assert.equal(response.status, 400);
});

test("rejects password changes with unexpected fields", async () => {
    const user = await createTestUser();
    const token = createToken(user);

    const response = await request(app)
        .patch("/api/users/me/password")
        .set("Authorization", `Bearer ${token}`)
        .send({
            currentPassword: originalPassword,
            newPassword: "NewPassword123",
            role: "admin"
        });

    assert.equal(response.status, 400);
});


// ACCOUNT DEACTIVATION

test("user can deactivate their own account", async () => {
    const user = await createTestUser();
    const token = createToken(user);

    const response = await request(app)
        .patch("/api/users/me/status")
        .set("Authorization", `Bearer ${token}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.message, "Account deactivated successfully");

    const updatedUser = await User.findById(user._id);

    assert.equal(updatedUser.isActive, false);
});

test("admin cannot deactivate their account through this endpoint", async () => {
    const admin = await createTestUser({
        email: "admin@example.com",
        role: "admin"
    });

    const token = createToken(admin);

    const response = await request(app)
        .patch("/api/users/me/status")
        .set("Authorization", `Bearer ${token}`);

    assert.equal(response.status, 400);

    const unchangedAdmin = await User.findById(admin._id);

    assert.equal(unchangedAdmin.isActive, true);
});

test("rejects deactivation without authentication", async () => {
    const response = await request(app)
        .patch("/api/users/me/status");

    assert.equal(response.status, 401);
});

test("user can reactivate a deactivated account", async () => {
    const user = await createTestUser({ isActive: false });

    const response = await request(app)
        .post("/api/users/me/reactivate")
        .send({
            email: user.email,
            password: originalPassword
        });

    assert.equal(response.status, 200);
    assert.equal(response.body.message, "Account reactivated successfully");
    assert.equal(response.body.user.isActive, true);
    assert.ok(response.body.token);

    const updatedUser = await User.findById(user._id);

    assert.equal(updatedUser.isActive, true);
});

test("rejects reactivation with an incorrect password", async () => {
    await createTestUser({ isActive: false });

    const response = await request(app)
        .post("/api/users/me/reactivate")
        .send({
            email: "test@example.com",
            password: "WrongPassword123"
        });

    assert.equal(response.status, 401);
});

test("rejects reactivation when the account is already active", async () => {
    await createTestUser();

    const response = await request(app)
        .post("/api/users/me/reactivate")
        .send({
            email: "test@example.com",
            password: originalPassword
        });

    assert.equal(response.status, 400);
});

test("suspended users cannot reactivate their accounts", async () => {
    await createTestUser({
        isActive: false,
        isSuspended: true
    });

    const response = await request(app)
        .post("/api/users/me/reactivate")
        .send({
            email: "test@example.com",
            password: originalPassword
        });

    assert.equal(response.status, 403);
});

test("rejects reactivation when credentials are missing", async () => {
    const response = await request(app)
        .post("/api/users/me/reactivate")
        .send({ email: "test@example.com" });

    assert.equal(response.status, 400);
});
