
import { AppError } from "../errors/appError.js";

export function validateProfileUpdate(req, res, next) {
    const { name, email } = req.body;

    const allowedFields = ["name", "email"];
    const receivedFields = Object.keys(req.body);

    if (receivedFields.length === 0) {
        throw new AppError("Request body cannot be empty", 400);
    }

    const hasInvalidField = receivedFields.some(
        field => !allowedFields.includes(field)
    );

    if (hasInvalidField) {
        throw new AppError("Only name and email can be updated", 400);
    }

    if (name !== undefined) {
        if (typeof name !== "string" || name.trim().length < 2) {
            throw new AppError("Name must be at least 2 characters long", 400);
        }

        if (name.trim().length > 50) {
            throw new AppError("Name must not exceed 50 characters", 400);
        }

        req.body.name = name.trim();
    }

    if (email !== undefined) {
        if (typeof email !== "string") {
            throw new AppError("Email must be a string", 400);
        }

        const normalizedEmail = email.trim().toLowerCase();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {
            throw new AppError("Please provide a valid email address", 400);
        }

        req.body.email = normalizedEmail;
    }

    next();
}
