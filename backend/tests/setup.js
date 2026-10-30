
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer;

process.env.JWT_SECRET = "nestly-test-secret-only";

export async function connectTestDB() {
    mongoServer = await MongoMemoryServer.create();

    await mongoose.connect(mongoServer.getUri());
}

export async function clearTestDB() {
    const collections = mongoose.connection.collections;

    for (const collection of Object.values(collections)) {
        await collection.deleteMany({});
    }
}

export async function closeTestDB() {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();

    if (mongoServer) {
        await mongoServer.stop();
    }
}
