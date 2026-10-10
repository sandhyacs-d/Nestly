import jwt from "jsonwebtoken";
import { AppError } from "../errors/appError.js";
import User from "../models/user.js";

export async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        throw new AppError("Authentication required", 401);
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
        throw new AppError("Authentication required", 401);
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await User.findById(decoded.userId);

        if (!user) {
            throw new AppError("User not found", 401);
        }

        if (
            user.passwordChangedAt &&
            decoded.iat <= Math.floor(user.passwordChangedAt.getTime() / 1000)
        ) {
            throw new AppError("Password changed. Please log in again.", 401);
        }

        req.user = user;

        next();

    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError("Invalid or expired token", 401);
    }

}