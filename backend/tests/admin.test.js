
import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import request from "supertest";

import { createServer } from "node:http";
import { Server } from "socket.io";

import app from "../app.js";
import User from "../models/user.js";

import { socketAuth } from "../middleware/socketAuth.js";
import { setIO, clearIO } from "../socket/io.js";
import { registerConversationHandler } from "../socket/conversationSocket.js";

import {
    connectTestDB,
    clearTestDB,
    closeTestDB
} from "./setup.js";


let httpServer;
let io;


function createToken(user) {
    return jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
}


async function createScenario() {
    const admin = await User.create({
        name: "Admin User",
        email: "admin@test.com",
        password: "hashedpassword",
        role: "admin"
    });

    const renter = await User.create({
        name: "Renter User",
        email: "renter@test.com",
        password: "hashedpassword",
        role: "renter"
    });

    const anotherRenter = await User.create({
        name: "Another Renter",
        email: "another@test.com",
        password: "hashedpassword",
        role: "renter"
    });

    return {
        admin,
        renter,
        anotherRenter,
        adminToken: createToken(admin),
        renterToken: createToken(renter)
    };
}


before(async () => {
    await connectTestDB();

    httpServer = createServer(app);
    io = new Server(httpServer);

    setIO(io);

    io.use(socketAuth);

    io.on("connection", async (socket) => {
        const userRoom = `user:${socket.data.userId}`;

        await socket.join(userRoom);

        registerConversationHandler(io, socket);
    });

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


// GET ALL USERS

test("Admin can retrieve all users without exposing passwords", async () => {
    const { adminToken } = await createScenario();

    const response = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`);

    assert.equal(response.status, 200);

    assert.equal(response.body.data.users.length, 3);

    assert.equal(response.body.pagination.page, 1);
    assert.equal(response.body.pagination.limit, 20);

    for (const user of response.body.data.users) {
        assert.equal(user.password, undefined);
        assert.equal(user.passwordChangedAt, undefined);
    }
});


// GET USER BY ID

test("Admin can retrieve a user by ID without exposing sensitive fields", async () => {
    const { adminToken, renter } = await createScenario();

    const response = await request(app)
        .get(`/api/admin/users/${renter._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

    assert.equal(response.status, 200);

    assert.equal(response.body.data.user.email, renter.email);

    assert.equal(response.body.data.user.password, undefined);
    assert.equal(response.body.data.user.passwordChangedAt, undefined);
});


// UPDATE USER ROLE

test("Admin cannot change their own role", async () => {
    const { admin, adminToken } = await createScenario();

    const response = await request(app)
        .patch(`/api/admin/users/${admin._id}/role`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
            role: "renter"
        });

    assert.equal(response.status, 403);

    const updatedAdmin = await User.findById(admin._id);

    assert.equal(updatedAdmin.role, "admin");
});


test("Admin can update another user's role", async () => {
    const { adminToken, renter } = await createScenario();

    const response = await request(app)
        .patch(`/api/admin/users/${renter._id}/role`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
            role: "owner"
        });

    assert.equal(response.status, 200);

    assert.equal(response.body.data.user.role, "owner");

    assert.equal(response.body.data.user.password, undefined);

    const updatedUser = await User.findById(renter._id);

    assert.equal(updatedUser.role, "owner");
});


test("Admin cannot assign the admin role through role update", async () => {
    const { adminToken, renter } = await createScenario();

    const response = await request(app)
        .patch(`/api/admin/users/${renter._id}/role`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
            role: "admin"
        });

    assert.equal(response.status, 400);

    const unchangedUser = await User.findById(renter._id);

    assert.equal(unchangedUser.role, "renter");
});


// USER SUSPENSION

test("Admin cannot suspend another admin", async () => {
    const { admin, adminToken } = await createScenario();

    const response = await request(app)
        .patch(`/api/admin/users/${admin._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
            isSuspended: true
        });

    assert.equal(response.status, 400);

    const unchangedAdmin = await User.findById(admin._id);

    assert.equal(unchangedAdmin.isSuspended, false);
});


test("Admin cannot update suspension status with a non-boolean value", async () => {
    const { adminToken, renter } = await createScenario();

    const response = await request(app)
        .patch(`/api/admin/users/${renter._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
            isSuspended: "true"
        });

    assert.equal(response.status, 400);

    const unchangedUser = await User.findById(renter._id);

    assert.equal(unchangedUser.isSuspended, false);
});


test("Admin can suspend a user and later lift the suspension", async () => {
    const { adminToken, renter } = await createScenario();

    const suspendResponse = await request(app)
        .patch(`/api/admin/users/${renter._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
            isSuspended: true
        });

    assert.equal(suspendResponse.status, 200);

    assert.equal(suspendResponse.body.data.user.isSuspended, true);

    assert.equal(suspendResponse.body.data.user.password, undefined);

    let updatedUser = await User.findById(renter._id);

    assert.equal(updatedUser.isSuspended, true);


    const unsuspendResponse = await request(app)
        .patch(`/api/admin/users/${renter._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
            isSuspended: false
        });

    assert.equal(unsuspendResponse.status, 200);

    assert.equal(unsuspendResponse.body.data.user.isSuspended, false);

    updatedUser = await User.findById(renter._id);

    assert.equal(updatedUser.isSuspended, false);
});


// AUTHORIZATION

test("Non-admin users cannot access admin endpoints", async () => {
    const { renterToken } = await createScenario();

    const response = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${renterToken}`);

    assert.equal(response.status, 403);
});
