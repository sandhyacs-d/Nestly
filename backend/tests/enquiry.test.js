
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import request from "supertest";

import app from "../app.js";
import User from "../models/user.js";
import Enquiry from "../models/enquiry.js";
import Property from "../models/property.js";

import {
    connectTestDB,
    clearTestDB,
    closeTestDB
} from "./setup.js";

process.env.JWT_SECRET = "test-secret-key";

let owner;
let renter;
let anotherOwner;
let property;
let enquiry;

function createToken(user) {
    return jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
}

async function createScenario() {
    owner = await User.create({
        name: "Property Owner",
        email: "owner@test.com",
        password: "test-password",
        role: "owner"
    });

    renter = await User.create({
        name: "Property Renter",
        email: "renter@test.com",
        password: "test-password",
        role: "renter"
    });

    anotherOwner = await User.create({
        name: "Another Owner",
        email: "another@test.com",
        password: "test-password",
        role: "owner"
    });

    property = await Property.create({
        owner: owner._id,
        title: "Test Apartment",
        description: "A test property",
        propertyType: "apartment",
        price: 15000,
        location: "Biratnagar",
        bedrooms: 2,
        bathrooms: 1
    });

    enquiry = await Enquiry.create({
        renter: renter._id,
        property: property._id,
        owner: owner._id,
        message: "I am interested in this property."
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

test("owner can accept a pending enquiry", async () => {
    const response = await request(app)
        .patch(`/api/enquiries/${enquiry._id}/status`)
        .set("Authorization", `Bearer ${createToken(owner)}`)
        .send({ status: "accepted" });

    assert.equal(response.status, 200);
    assert.equal(response.body.data.enquiry.status, "accepted");

    const updatedEnquiry = await Enquiry.findById(enquiry._id);
    assert.equal(updatedEnquiry.status, "accepted");
});

test("renter cannot update enquiry status", async () => {
    const response = await request(app)
        .patch(`/api/enquiries/${enquiry._id}/status`)
        .set("Authorization", `Bearer ${createToken(renter)}`)
        .send({ status: "accepted" });

    assert.equal(response.status, 403);
});

test("another owner cannot update an enquiry they do not own", async () => {
    const response = await request(app)
        .patch(`/api/enquiries/${enquiry._id}/status`)
        .set("Authorization", `Bearer ${createToken(anotherOwner)}`)
        .send({ status: "accepted" });

    assert.equal(response.status, 404);
});

test("an already processed enquiry cannot be updated again", async () => {
    await request(app)
        .patch(`/api/enquiries/${enquiry._id}/status`)
        .set("Authorization", `Bearer ${createToken(owner)}`)
        .send({ status: "accepted" });

    const secondResponse = await request(app)
        .patch(`/api/enquiries/${enquiry._id}/status`)
        .set("Authorization", `Bearer ${createToken(owner)}`)
        .send({ status: "rejected" });

    assert.equal(secondResponse.status, 409);

    const savedEnquiry = await Enquiry.findById(enquiry._id);
    assert.equal(savedEnquiry.status, "accepted");
});

