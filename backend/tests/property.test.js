
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import request from "supertest";

import mongoose from "mongoose";
import app from "../app.js";
import User from "../models/user.js";
import Property from "../models/property.js";

import {
    connectTestDB,
    clearTestDB,
    closeTestDB
} from "./setup.js";

let owner;
let anotherOwner;
let renter;
let ownerToken;
let anotherOwnerToken;
let renterToken;
let property;

const validProperty = {
    title: "Spacious Apartment",
    description: "A comfortable apartment with plenty of natural light.",
    propertyType: "apartment",
    price: 25000,
    location: "Biratnagar",
    bedrooms: 2,
    bathrooms: 1,
    kitchen: true,
    furnished: true,
    amenities: ["Parking", "Water supply"],
    images: ["https://example.com/apartment.jpg"]
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

    anotherOwner = await User.create({
        name: "Another Owner",
        email: "anotherowner@example.com",
        password: "hashedpassword",
        role: "owner"
    });

    renter = await User.create({
        name: "Property Renter",
        email: "renter@example.com",
        password: "hashedpassword",
        role: "renter"
    });

    ownerToken = createToken(owner);
    anotherOwnerToken = createToken(anotherOwner);
    renterToken = createToken(renter);

    property = await createTestProperty(owner._id);
});

after(async () => {
    await closeTestDB();
});

test("Owner can create a property", async () => {
    const response = await request(app)
        .post("/api/properties")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send(validProperty);

    assert.equal(response.status, 201);
    assert.equal(response.body.message, "Property created successfully");
    assert.equal(response.body.property.title, validProperty.title);
    assert.equal(response.body.property.owner, owner._id.toString());
    assert.equal(response.body.property.status, "active");
});

test("Renter cannot create a property", async () => {
    const response = await request(app)
        .post("/api/properties")
        .set("Authorization", `Bearer ${renterToken}`)
        .send(validProperty);

    assert.equal(response.status, 403);
});

test("Unauthenticated user cannot create a property", async () => {
    const response = await request(app)
        .post("/api/properties")
        .send(validProperty);

    assert.equal(response.status, 401);
});

test("Property creation fails when required fields are missing", async () => {
    const invalidProperty = { ...validProperty };
    delete invalidProperty.title;

    const response = await request(app)
        .post("/api/properties")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send(invalidProperty);

    assert.equal(response.status, 400);
});

test("Property creation fails with an invalid property type", async () => {
    const response = await request(app)
        .post("/api/properties")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
            ...validProperty,
            propertyType: "villa"
        });

    assert.equal(response.status, 400);
});

test("Property creation fails with an invalid price", async () => {
    const response = await request(app)
        .post("/api/properties")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
            ...validProperty,
            price: -100
        });

    assert.equal(response.status, 400);
});

test("Anyone can retrieve active properties", async () => {
    const response = await request(app)
        .get("/api/properties");

    assert.equal(response.status, 200);
    assert.equal(response.body.properties.length, 1);
    assert.equal(
        response.body.properties[0]._id,
        property._id.toString()
    );
});

test("Property listing excludes inactive properties", async () => {
    await createTestProperty(owner._id, {
        title: "Inactive Apartment",
        status: "inactive"
    });

    const response = await request(app)
        .get("/api/properties");

    assert.equal(response.status, 200);
    assert.equal(response.body.properties.length, 1);
    assert.equal(response.body.properties[0].title, validProperty.title);
});

test("Property listing supports search and location filters", async () => {
    await createTestProperty(owner._id, {
        title: "Modern House",
        location: "Dharan"
    });

    const response = await request(app)
        .get("/api/properties")
        .query({
            search: "modern",
            location: "Dharan"
        });

    assert.equal(response.status, 200);
    assert.equal(response.body.properties.length, 1);
    assert.equal(response.body.properties[0].title, "Modern House");
});

test("Property listing supports price filters", async () => {
    await createTestProperty(owner._id, {
        title: "Budget Room",
        price: 10000
    });

    const response = await request(app)
        .get("/api/properties")
        .query({
            minPrice: 15000,
            maxPrice: 30000
        });

    assert.equal(response.status, 200);
    assert.equal(response.body.properties.length, 1);
    assert.equal(response.body.properties[0].price, 25000);
});

test("Property listing supports pagination", async () => {
    await createTestProperty(owner._id, {
        title: "Second Apartment"
    });

    const response = await request(app)
        .get("/api/properties")
        .query({
            page: 1,
            limit: 1
        });

    assert.equal(response.status, 200);
    assert.equal(response.body.properties.length, 1);
    assert.equal(response.body.pagination.page, 1);
    assert.equal(response.body.pagination.limit, 1);
    assert.equal(response.body.pagination.totalProperties, 2);
    assert.equal(response.body.pagination.totalPages, 2);
    assert.equal(response.body.pagination.hasNextPage, true);
});

test("Property listing rejects invalid query parameters", async () => {
    const response = await request(app)
        .get("/api/properties")
        .query({
            minPrice: 30000,
            maxPrice: 10000
        });

    assert.equal(response.status, 400);
});

test("Anyone can retrieve an active property by ID", async () => {
    const response = await request(app)
        .get(`/api/properties/${property._id}`);

    assert.equal(response.status, 200);
    assert.equal(response.body._id, property._id.toString());
    assert.equal(response.body.title, validProperty.title);
});

test("Retrieving a nonexistent property returns 404", async () => {
    const nonexistentId = new mongoose.Types.ObjectId();

    const response = await request(app)
        .get(`/api/properties/${nonexistentId}`);

    assert.equal(response.status, 404);
});

test("Retrieving an inactive property returns 404", async () => {
    property.status = "inactive";
    await property.save();

    const response = await request(app)
        .get(`/api/properties/${property._id}`);

    assert.equal(response.status, 404);
});

test("Owner can update their own property", async () => {
    const response = await request(app)
        .patch(`/api/properties/${property._id}`)
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
            title: "Updated Apartment",
            price: 30000
        });

    assert.equal(response.status, 200);
    assert.equal(response.body.message, "Property updated successfully");
    assert.equal(response.body.property.title, "Updated Apartment");
    assert.equal(response.body.property.price, 30000);
});

test("Another owner cannot update someone else's property", async () => {
    const response = await request(app)
        .patch(`/api/properties/${property._id}`)
        .set("Authorization", `Bearer ${anotherOwnerToken}`)
        .send({
            title: "Unauthorized Update"
        });

    assert.equal(response.status, 403);
});

test("Property update rejects an empty request body", async () => {
    const response = await request(app)
        .patch(`/api/properties/${property._id}`)
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({});

    assert.equal(response.status, 400);
});

test("Property update rejects fields that cannot be updated", async () => {
    const response = await request(app)
        .patch(`/api/properties/${property._id}`)
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
            status: "rented"
        });

    assert.equal(response.status, 400);
});

test("Owner can delete their own property", async () => {
    const response = await request(app)
        .delete(`/api/properties/${property._id}`)
        .set("Authorization", `Bearer ${ownerToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.message, "Property deleted successfully");

    const deletedProperty = await Property.findById(property._id);
    assert.equal(deletedProperty, null);
});

test("Another owner cannot delete someone else's property", async () => {
    const response = await request(app)
        .delete(`/api/properties/${property._id}`)
        .set("Authorization", `Bearer ${anotherOwnerToken}`);

    assert.equal(response.status, 403);

    const existingProperty = await Property.findById(property._id);
    assert.ok(existingProperty);
});
