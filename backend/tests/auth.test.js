
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import request from "supertest";

import app from "../app.js";
import User from "../models/user.js";
import { hashPassword } from "../utils/password.js";
import {
    connectTestDB,
    clearTestDB,
    closeTestDB
} from "./setup.js";

before(async () => {
    await connectTestDB();
});

beforeEach(async () => {
    await clearTestDB();
});

after(async () => {
    await closeTestDB();
});

const validUser = {
    name: "Test User",
    email: "test@example.com",
    password: "Password123"
};

async function createTestUser(overrides = {}) {
    const hashedPassword = await hashPassword(validUser.password);

    return User.create({
        name: validUser.name,
        email: validUser.email,
        password: hashedPassword,
        ...overrides
    });
}

function createToken(userId) {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
}

// REGISTRATION

test("registers a new user successfully", async () => {
    const response = await request(app)
        .post("/api/auth/register")
        .send(validUser);

    assert.equal(response.status, 201);
    assert.equal(response.body.message, "User successfully registered");

    const user = await User.findOne({ email: validUser.email });

    assert.ok(user);
    assert.equal(user.name, validUser.name);
    assert.equal(user.role, "renter");
    assert.notEqual(user.password, validUser.password);
});

test("normalizes email during registration", async () => {
    const response = await request(app)
        .post("/api/auth/register")
        .send({
            ...validUser,
            email: "  TEST@EXAMPLE.COM  "
        });

    assert.equal(response.status, 201);

    const user = await User.findOne({
        email: "test@example.com"
    });

    assert.ok(user);
});

test("rejects registration with an existing email", async () => {
    await createTestUser();

    const response = await request(app)
        .post("/api/auth/register")
        .send(validUser);

    assert.equal(response.status, 409);
});

test("rejects registration with invalid input", async () => {
    const response = await request(app)
        .post("/api/auth/register")
        .send({
            name: "A",
            email: "invalid-email",
            password: "weak"
        });

    assert.equal(response.status, 400);
});

test("does not allow users to choose their own role during registration", async () => {
    const response = await request(app)
        .post("/api/auth/register")
        .send({
            ...validUser,
            role: "admin"
        });

    assert.equal(response.status, 201);

    const user = await User.findOne({
        email: validUser.email
    });

    assert.equal(user.role, "renter");
});

// LOGIN

test("logs in a user with valid credentials", async () => {
    await createTestUser();

    const response = await request(app)
        .post("/api/auth/login")
        .send({
            email: validUser.email,
            password: validUser.password
        });

    assert.equal(response.status, 200);
    assert.equal(response.body.message, "Login successful");
    assert.ok(response.body.token);
    assert.equal(response.body.user.email, validUser.email);
});

test("normalizes email during login", async () => {
    await createTestUser();

    const response = await request(app)
        .post("/api/auth/login")
        .send({
            email: "  TEST@EXAMPLE.COM ",
            password: validUser.password
        });

    assert.equal(response.status, 200);
    assert.ok(response.body.token);
});

test("rejects login with an incorrect password", async () => {
    await createTestUser();

    const response = await request(app)
        .post("/api/auth/login")
        .send({
            email: validUser.email,
            password: "WrongPassword123"
        });

    assert.equal(response.status, 401);
});

test("rejects login with an unregistered email", async () => {
    const response = await request(app)
        .post("/api/auth/login")
        .send({
            email: validUser.email,
            password: validUser.password
        });

    assert.equal(response.status, 401);
});

test("rejects login when the account is deactivated", async () => {
    await createTestUser({ isActive: false });

    const response = await request(app)
        .post("/api/auth/login")
        .send({
            email: validUser.email,
            password: validUser.password
        });

    assert.equal(response.status, 403);
});

test("rejects login when the account is suspended", async () => {
    await createTestUser({ isSuspended: true });

    const response = await request(app)
        .post("/api/auth/login")
        .send({
            email: validUser.email,
            password: validUser.password
        });

    assert.equal(response.status, 403);
});

// AUTHENTICATED USER

test("retrieves the current user's details with a valid token", async () => {
    const user = await createTestUser();
    const token = createToken(user._id);

    const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.user.id, user._id.toString());
    assert.equal(response.body.user.email, validUser.email);
    assert.equal(response.body.user.role, "renter");
});

test("rejects access to current user without a token", async () => {
    const response = await request(app)
        .get("/api/auth/me");

    assert.equal(response.status, 401);
});

test("rejects an invalid JWT", async () => {
    const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token");

    assert.equal(response.status, 401);
});

test("rejects a token belonging to a nonexistent user", async () => {
    const fakeId = "507f1f77bcf86cd799439011";
    const token = createToken(fakeId);

    const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

    assert.equal(response.status, 401);
});

test("rejects access when the user's account is deactivated", async () => {
    const user = await createTestUser({ isActive: false });
    const token = createToken(user._id);

    const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

    assert.equal(response.status, 403);
});

test("rejects access when the user's account is suspended", async () => {
    const user = await createTestUser({ isSuspended: true });
    const token = createToken(user._id);

    const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

    assert.equal(response.status, 403);
});
