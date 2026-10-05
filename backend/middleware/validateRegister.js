import { AppError } from "../errors/appError.js";

export function validateRegister(req, res, next) {

    if (
        typeof req.body !== "object" ||
        req.body === null ||
        Array.isArray(req.body)
    ) {
        throw new AppError("Request body must be an object", 400);
    }


    const { name, email, password } = req.body;

    if (name === undefined) {
        throw new AppError("name is required", 400);
    }

    if (typeof name !== "string") {
        throw new AppError("name must be a string", 400);
    }

    if (name.trim() === "") {
        throw new AppError("name cannot be empty", 400);
    }

    if (name.trim().length < 2) {
        throw new AppError("name must be at least 2 characters", 400);
    }

    if (name.trim().length > 50) {
        throw new AppError("name must not exceed 50 characters", 400);
    }

    req.body.name = name.trim();

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

    const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

    if (password === undefined) {
        throw new AppError("password is required", 400);
    }

    if (typeof password !== "string") {
        throw new AppError("password must be a string", 400);
    }

    if (password.trim() === "") {
        throw new AppError("password cannot be empty", 400);
    }

    if (password.length > 128) {
        throw new AppError("password must not exceed 128 characters", 400);
    }

    if (!passwordPattern.test(password)) {
        throw new AppError("invalid password format", 400);
    }


    next();
}