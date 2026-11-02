
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import request from "supertest";

import app from "../app.js";
import User from "../models/user.js";
import RoommateProfile from "../models/roommateProfile.js";

import {
    connectTestDB,
    clearTestDB,
    closeTestDB
} from "./setup.js";

let renter;
let anotherRenter;
let owner;

const profileData = {
    bio: "Looking for a clean and friendly roommate.",
    preferredLocation: "Kathmandu",
    budgetMin: 5000,
    budgetMax: 12000,
    occupation: "Student",
    lifestyle: ["non-smoker", "clean"],
    moveInDate: "2026-12-01"
};

function createToken(user) {
    return jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
}

async function createProfile(user, overrides = {}) {
    return RoommateProfile.create({
        user: user._id,
        ...profileData,
        ...overrides
    });
}

before(async () => {
    await connectTestDB();
});

beforeEach(async () => {
    await clearTestDB();

    renter = await User.create({
        name: "Test Renter",
        email: "renter@test.com",
        password: "test-password",
        role: "renter"
    });

    anotherRenter = await User.create({
        name: "Another Renter",
        email: "another@test.com",
        password: "test-password",
        role: "renter"
    });

    owner = await User.create({
        name: "Property Owner",
        email: "owner@test.com",
        password: "test-password",
        role: "owner"
    });
});

after(async () => {
    await closeTestDB();
});


// PROFILE CREATION

test("renter can create a roommate profile", async () => {
    const response = await request(app)
        .post("/api/roommate-profiles")
        .set("Authorization", `Bearer ${createToken(renter)}`)
        .send(profileData);

    assert.equal(response.status, 201);
    assert.equal(response.body.message, "Roommate profile created successfully");
    assert.equal(response.body.data.profile.preferredLocation, "Kathmandu");

    const savedProfile = await RoommateProfile.findOne({
        user: renter._id
    });

    assert.ok(savedProfile);
    assert.equal(savedProfile.budgetMin, 5000);
    assert.equal(savedProfile.budgetMax, 12000);
    assert.equal(savedProfile.isActive, true);
});

test("trims whitespace from preferred location", async () => {
    const response = await request(app)
        .post("/api/roommate-profiles")
        .set("Authorization", `Bearer ${createToken(renter)}`)
        .send({
            ...profileData,
            preferredLocation: "  Kathmandu  "
        });

    assert.equal(response.status, 201);
    assert.equal(
        response.body.data.profile.preferredLocation,
        "Kathmandu"
    );
});

test("rejects profile creation without authentication", async () => {
    const response = await request(app)
        .post("/api/roommate-profiles")
        .send(profileData);

    assert.equal(response.status, 401);
});

test("only renters can create roommate profiles", async () => {
    const response = await request(app)
        .post("/api/roommate-profiles")
        .set("Authorization", `Bearer ${createToken(owner)}`)
        .send(profileData);

    assert.equal(response.status, 403);
});

test("rejects profile creation without preferred location", async () => {
    const { preferredLocation, ...invalidData } = profileData;

    const response = await request(app)
        .post("/api/roommate-profiles")
        .set("Authorization", `Bearer ${createToken(renter)}`)
        .send(invalidData);

    assert.equal(response.status, 400);
});

test("rejects profile creation without minimum budget", async () => {
    const { budgetMin, ...invalidData } = profileData;

    const response = await request(app)
        .post("/api/roommate-profiles")
        .set("Authorization", `Bearer ${createToken(renter)}`)
        .send(invalidData);

    assert.equal(response.status, 400);
});

test("rejects profile creation without maximum budget", async () => {
    const { budgetMax, ...invalidData } = profileData;

    const response = await request(app)
        .post("/api/roommate-profiles")
        .set("Authorization", `Bearer ${createToken(renter)}`)
        .send(invalidData);

    assert.equal(response.status, 400);
});

test("rejects negative minimum budget", async () => {
    const response = await request(app)
        .post("/api/roommate-profiles")
        .set("Authorization", `Bearer ${createToken(renter)}`)
        .send({
            ...profileData,
            budgetMin: -100
        });

    assert.equal(response.status, 400);
});

test("rejects maximum budget lower than minimum budget", async () => {
    const response = await request(app)
        .post("/api/roommate-profiles")
        .set("Authorization", `Bearer ${createToken(renter)}`)
        .send({
            ...profileData,
            budgetMin: 15000,
            budgetMax: 5000
        });

    assert.equal(response.status, 400);
});

test("rejects non-numeric budget values", async () => {
    const response = await request(app)
        .post("/api/roommate-profiles")
        .set("Authorization", `Bearer ${createToken(renter)}`)
        .send({
            ...profileData,
            budgetMin: "5000"
        });

    assert.equal(response.status, 400);
});

test("rejects duplicate roommate profile creation", async () => {
    await createProfile(renter);

    const response = await request(app)
        .post("/api/roommate-profiles")
        .set("Authorization", `Bearer ${createToken(renter)}`)
        .send(profileData);

    assert.equal(response.status, 409);
});


// PROFILE UPDATES

test("renter can update their roommate profile", async () => {
    await createProfile(renter);

    const response = await request(app)
        .patch("/api/roommate-profiles")
        .set("Authorization", `Bearer ${createToken(renter)}`)
        .send({
            bio: "Updated roommate bio",
            preferredLocation: "Pokhara"
        });

    assert.equal(response.status, 200);
    assert.equal(response.body.message, "Roommate profile updated successfully");
    assert.equal(response.body.data.profile.bio, "Updated roommate bio");
    assert.equal(response.body.data.profile.preferredLocation, "Pokhara");
});

test("renter can update their budget range", async () => {
    await createProfile(renter);

    const response = await request(app)
        .patch("/api/roommate-profiles")
        .set("Authorization", `Bearer ${createToken(renter)}`)
        .send({
            budgetMin: 8000,
            budgetMax: 15000
        });

    assert.equal(response.status, 200);
    assert.equal(response.body.data.profile.budgetMin, 8000);
    assert.equal(response.body.data.profile.budgetMax, 15000);
});

test("renter can deactivate their roommate profile", async () => {
    await createProfile(renter);

    const response = await request(app)
        .patch("/api/roommate-profiles")
        .set("Authorization", `Bearer ${createToken(renter)}`)
        .send({ isActive: false });

    assert.equal(response.status, 200);
    assert.equal(response.body.data.profile.isActive, false);
});

test("rejects updates when the renter has no roommate profile", async () => {
    const response = await request(app)
        .patch("/api/roommate-profiles")
        .set("Authorization", `Bearer ${createToken(renter)}`)
        .send({ bio: "Updated bio" });

    assert.equal(response.status, 404);
});

test("rejects profile updates without authentication", async () => {
    const response = await request(app)
        .patch("/api/roommate-profiles")
        .send({ bio: "Updated bio" });

    assert.equal(response.status, 401);
});

test("only renters can update roommate profiles", async () => {
    const response = await request(app)
        .patch("/api/roommate-profiles")
        .set("Authorization", `Bearer ${createToken(owner)}`)
        .send({ bio: "Updated bio" });

    assert.equal(response.status, 403);
});

test("rejects an invalid budget range during profile update", async () => {
    await createProfile(renter);

    const response = await request(app)
        .patch("/api/roommate-profiles")
        .set("Authorization", `Bearer ${createToken(renter)}`)
        .send({
            budgetMin: 20000,
            budgetMax: 10000
        });

    assert.equal(response.status, 400);
});

test("rejects a negative budget during profile update", async () => {
    await createProfile(renter);

    const response = await request(app)
        .patch("/api/roommate-profiles")
        .set("Authorization", `Bearer ${createToken(renter)}`)
        .send({ budgetMin: -500 });

    assert.equal(response.status, 400);
});

test("rejects an invalid lifestyle value during profile update", async () => {
    await createProfile(renter);

    const response = await request(app)
        .patch("/api/roommate-profiles")
        .set("Authorization", `Bearer ${createToken(renter)}`)
        .send({ lifestyle: [123] });

    assert.equal(response.status, 400);
});


// ROOMMATE DISCOVERY

test("renter can discover other active roommate profiles", async () => {
    await createProfile(anotherRenter);

    const response = await request(app)
        .get("/api/roommate-profiles/discover")
        .set("Authorization", `Bearer ${createToken(renter)}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.results, 1);
    assert.equal(response.body.data.profiles[0].user.name, "Another Renter");
});

test("discovery excludes the current user's own profile", async () => {
    await createProfile(renter);
    await createProfile(anotherRenter);

    const response = await request(app)
        .get("/api/roommate-profiles/discover")
        .set("Authorization", `Bearer ${createToken(renter)}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.results, 1);
    assert.notEqual(
        response.body.data.profiles[0].user._id,
        renter._id.toString()
    );
});

test("discovery excludes inactive roommate profiles", async () => {
    await createProfile(anotherRenter, { isActive: false });

    const response = await request(app)
        .get("/api/roommate-profiles/discover")
        .set("Authorization", `Bearer ${createToken(renter)}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.results, 0);
});

test("discovery filters profiles by location", async () => {
    await createProfile(anotherRenter, {
        preferredLocation: "Kathmandu"
    });

    const thirdRenter = await User.create({
        name: "Third Renter",
        email: "third@test.com",
        password: "test-password",
        role: "renter"
    });

    await createProfile(thirdRenter, {
        preferredLocation: "Pokhara"
    });

    const response = await request(app)
        .get("/api/roommate-profiles/discover?location=kath")
        .set("Authorization", `Bearer ${createToken(renter)}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.results, 1);
    assert.equal(
        response.body.data.profiles[0].preferredLocation,
        "Kathmandu"
    );
});

test("discovery filters profiles by lifestyle", async () => {
    await createProfile(anotherRenter, {
        lifestyle: ["non-smoker", "clean"]
    });

    const response = await request(app)
        .get("/api/roommate-profiles/discover?lifestyle=non-smoker")
        .set("Authorization", `Bearer ${createToken(renter)}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.results, 1);
});

test("discovery filters profiles by overlapping budget range", async () => {
    await createProfile(anotherRenter, {
        budgetMin: 5000,
        budgetMax: 12000
    });

    const response = await request(app)
        .get("/api/roommate-profiles/discover?budgetMin=8000&budgetMax=15000")
        .set("Authorization", `Bearer ${createToken(renter)}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.results, 1);
});

test("discovery supports pagination", async () => {
    await createProfile(anotherRenter);

    const thirdRenter = await User.create({
        name: "Third Renter",
        email: "third@test.com",
        password: "test-password",
        role: "renter"
    });

    await createProfile(thirdRenter);

    const response = await request(app)
        .get("/api/roommate-profiles/discover?page=1&limit=1")
        .set("Authorization", `Bearer ${createToken(renter)}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.results, 1);
    assert.equal(response.body.total, 2);
    assert.equal(response.body.pagination.page, 1);
    assert.equal(response.body.pagination.limit, 1);
    assert.equal(response.body.pagination.totalPages, 2);
});

test("rejects invalid discovery pagination", async () => {
    const response = await request(app)
        .get("/api/roommate-profiles/discover?page=0&limit=10")
        .set("Authorization", `Bearer ${createToken(renter)}`);

    assert.equal(response.status, 400);
});

test("rejects discovery limit greater than 50", async () => {
    const response = await request(app)
        .get("/api/roommate-profiles/discover?page=1&limit=51")
        .set("Authorization", `Bearer ${createToken(renter)}`);

    assert.equal(response.status, 400);
});

test("rejects invalid discovery budget range", async () => {
    const response = await request(app)
        .get("/api/roommate-profiles/discover?budgetMin=15000&budgetMax=5000")
        .set("Authorization", `Bearer ${createToken(renter)}`);

    assert.equal(response.status, 400);
});

test("rejects an empty location filter", async () => {
    const response = await request(app)
        .get("/api/roommate-profiles/discover?location=")
        .set("Authorization", `Bearer ${createToken(renter)}`);

    assert.equal(response.status, 400);
});

test("rejects discovery without authentication", async () => {
    const response = await request(app)
        .get("/api/roommate-profiles/discover");

    assert.equal(response.status, 401);
});
