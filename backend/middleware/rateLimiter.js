import { rateLimit } from "express-rate-limit";

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === "test",
    message: {
        success: false,
        message: "Too many requests. Please try again later.",
    },
});

export function createAuthLimiter(options = {}) {
    return rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 5,
        standardHeaders: true,
        legacyHeaders: false,
        skip: () => process.env.NODE_ENV === "test",
        message: {
            success: false,
            message: "Too many authentication attempts. Please try again later.",
        },
        ...options,
    });
}

export const authLimiter = createAuthLimiter();