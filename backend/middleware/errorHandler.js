
import mongoose from "mongoose";
import { AppError } from "../errors/appError.js";

export function errorHandler(err, req, res, next) {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message
        });
    }

    if (err instanceof mongoose.Error.ValidationError) {
        const messages = Object.values(err.errors).map(
            (error) => error.message
        );

        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: messages
        });
    }

    if (err instanceof mongoose.Error.CastError) {
        return res.status(400).json({
            success: false,
            message: "Invalid value provided"
        });
    }

    if (err.code === 11000) {
        return res.status(409).json({
            success: false,
            message: "A record with this value already exists"
        });
    }

    console.error(err);

    return res.status(500).json({
        success: false,
        message: "Internal Server Error"
    });
}


