import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import request from "supertest";
import { createAuthLimiter } from "../middleware/rateLimiter.js";

test("blocks authentication requests after the configured limit", async () => {
    const app = express();

    app.use(createAuthLimiter({
        limit: 5,
        windowMs: 60 * 1000,
        skip: () => false,
    }));

    app.post("/login", (req, res) => {
        res.status(200).json({ message: "Login successful" });
    });

    
    for (let i = 0; i < 5; i++) {
        const response = await request(app).post("/login");
        assert.equal(response.status, 200);
    }

    const response = await request(app).post("/login");

    assert.equal(response.status, 429);
    assert.equal(
        response.body.message,
        "Too many authentication attempts. Please try again later."
    );
});