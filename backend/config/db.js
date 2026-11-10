import mongoose from "mongoose";

export async function connectdb() {
    await mongoose.connect(process.env.MONGO_URI);
}

export async function disconnectdb() {
    await mongoose.disconnect();
}