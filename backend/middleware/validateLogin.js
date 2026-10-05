import { AppError } from "../errors/appError.js";

export function validateLogin(req, res, next) {
    if (
        typeof req.body !== "object" ||
        req.body === null ||
        Array.isArray(req.body)
    ) {
        throw new AppError("Request body must be an object", 400);
    }

    const { email, password } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email === undefined) {
        throw new AppError("email is required", 400);
    }

    if (typeof email !== "string") {
        throw new AppError("email must be a string", 400);
    }

    if (email.trim() === "") {
        throw new AppError("email cannot be empty", 400);
    }

    if (!emailRegex.test(email.trim())) {
        throw new AppError("invalid email format", 400);
    }

    req.body.email = email.trim().toLowerCase();

    if (password === undefined) {
        throw new AppError("password is required", 400);
    }

    if (typeof password !== "string") {
        throw new AppError("password must be a string", 400);
    }

    if (password.trim() === "") {
        throw new AppError("password cannot be empty", 400);
    }



    next();
}