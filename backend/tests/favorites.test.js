
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import request from "supertest";

import app from "../app.js";
import User from "../models/user.js";
import Property from "../models/property.js";
import Favorite from "../models/favorites.js";

import {
    connectTestDB,
    clearTestDB,
    closeTestDB
} from "./setup.js";

let owner;
let renter;
let anotherRenter;
let ownerToken;
let renterToken;
let anotherRenterToken;
let property;

const validProperty = {
    title: "Spacious Apartment",
    description: "A comfortable apartment with plenty of natural light.",
    propertyType: "apartment",
    price: 25000,
    location: "Biratnagar",
    bedrooms: 2,
    bathrooms: 1
};

function createToken(user) {
    return jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
}

async function createTestProperty(ownerId, overrides = {}) {
    return Property.create({
        ...validProperty,
        owner: ownerId,
        ...overrides
    });
}

before(async () => {
    await connectTestDB();
});

beforeEach(async () => {
    await clearTestDB();

    owner = await User.create({
        name: "Property Owner",
        email: "owner@example.com",
        password: "hashedpassword",
        role: "owner"
    });

    renter = await User.create({
        name: "Property Renter",
        email: "renter@example.com",
        password: "hashedpassword",
        role: "renter"
    });

    anotherRenter = await User.create({
        name: "Another Renter",
        email: "another@example.com",
        password: "hashedpassword",
        role: "renter"
    });

    ownerToken = createToken(owner);
    renterToken = createToken(renter);
    anotherRenterToken = createToken(anotherRenter);

    property = await createTestProperty(owner._id);
});

after(async () => {
    await closeTestDB();
});

test("Authenticated renter can add a property to favorites", async () => {
    const response = await request(app)
        .post(`/api/favorites/${property._id}`)
        .set("Authorization", `Bearer ${renterToken}`);

    assert.equal(response.status, 201);
    assert.equal(response.body.success, true);
    assert.equal(response.body.message, "Property added to favorites");
    assert.equal(
        response.body.data.favorite.user,
        renter._id.toString()
    );
    assert.equal(
        response.body.data.favorite.property,
        property._id.toString()
    );

    const favorite = await Favorite.findOne({
        user: renter._id,
        property: property._id
    });

    assert.ok(favorite);
});

test("Unauthenticated user cannot add a favorite", async () => {
    const response = await request(app)
        .post(`/api/favorites/${property._id}`);

    assert.equal(response.status, 401);
});

test("Adding a nonexistent property to favorites returns 404", async () => {
    const response = await request(app)
        .post("/api/favorites/000000000000000000000001")
        .set("Authorization", `Bearer ${renterToken}`);

    assert.equal(response.status, 404);
});

test("Inactive property cannot be added to favorites", async () => {
    property.status = "inactive";
    await property.save();

    const response = await request(app)
        .post(`/api/favorites/${property._id}`)
        .set("Authorization", `Bearer ${renterToken}`);

    assert.equal(response.status, 400);

    const favorite = await Favorite.findOne({
        user: renter._id,
        property: property._id
    });

    assert.equal(favorite, null);
});

test("User cannot add the same property to favorites twice", async () => {
    await Favorite.create({
        user: renter._id,
        property: property._id
    });

    const response = await request(app)
        .post(`/api/favorites/${property._id}`)
        .set("Authorization", `Bearer ${renterToken}`);

    assert.equal(response.status, 409);
});

test("User can retrieve their own favorites", async () => {
    await Favorite.create({
        user: renter._id,
        property: property._id
    });

    const response = await request(app)
        .get("/api/favorites")
        .set("Authorization", `Bearer ${renterToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.results, 1);
    assert.equal(response.body.data.favorites.length, 1);
    assert.equal(
        response.body.data.favorites[0].property._id,
        property._id.toString()
    );
    assert.equal(
        response.body.data.favorites[0].property.title,
        property.title
    );
});

test("User cannot retrieve another user's favorites", async () => {
    await Favorite.create({
        user: renter._id,
        property: property._id
    });

    const response = await request(app)
        .get("/api/favorites")
        .set("Authorization", `Bearer ${anotherRenterToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.results, 0);
    assert.equal(response.body.data.favorites.length, 0);
});

test("Unauthenticated user cannot retrieve favorites", async () => {
    const response = await request(app)
        .get("/api/favorites");

    assert.equal(response.status, 401);
});

test("User can remove a property from favorites", async () => {
    await Favorite.create({
        user: renter._id,
        property: property._id
    });

    const response = await request(app)
        .delete(`/api/favorites/${property._id}`)
        .set("Authorization", `Bearer ${renterToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.message, "Property removed from favorites");

    const favorite = await Favorite.findOne({
        user: renter._id,
        property: property._id
    });

    assert.equal(favorite, null);
});

test("User cannot remove another user's favorite", async () => {
    await Favorite.create({
        user: renter._id,
        property: property._id
    });

    const response = await request(app)
        .delete(`/api/favorites/${property._id}`)
        .set("Authorization", `Bearer ${anotherRenterToken}`);

    assert.equal(response.status, 404);

    const favorite = await Favorite.findOne({
        user: renter._id,
        property: property._id
    });

    assert.ok(favorite);
});

test("Removing a property that is not in favorites returns 404", async () => {
    const response = await request(app)
        .delete(`/api/favorites/${property._id}`)
        .set("Authorization", `Bearer ${renterToken}`);

    assert.equal(response.status, 404);
});

test("Unauthenticated user cannot remove a favorite", async () => {
    const response = await request(app)
        .delete(`/api/favorites/${property._id}`);

    assert.equal(response.status, 401);
});

test("Different users can independently favorite the same property", async () => {
    const firstResponse = await request(app)
        .post(`/api/favorites/${property._id}`)
        .set("Authorization", `Bearer ${renterToken}`);

    const secondResponse = await request(app)
        .post(`/api/favorites/${property._id}`)
        .set("Authorization", `Bearer ${anotherRenterToken}`);

    assert.equal(firstResponse.status, 201);
    assert.equal(secondResponse.status, 201);

    const favorites = await Favorite.find({
        property: property._id
    });

    assert.equal(favorites.length, 2);
});
