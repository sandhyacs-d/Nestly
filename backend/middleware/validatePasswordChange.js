import { AppError } from "../errors/appError.js";

export function validatePasswordChange(req, res, next) {
    const { currentPassword, newPassword } = req.body;

    const allowedFields = ["currentPassword", "newPassword"];
    const receivedFields = Object.keys(req.body);

    if (receivedFields.length === 0) {
        throw new AppError("Request body cannot be empty", 400);
    }

    const hasInvalidField = receivedFields.some(
        field => !allowedFields.includes(field)
    );

    if (hasInvalidField) {
        throw new AppError(
            "Only currentPassword and newPassword are allowed",
            400
        );
    }

    if (
        typeof currentPassword !== "string" ||
        currentPassword.length === 0
    ) {
        throw new AppError("Current password is required", 400);
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
        throw new AppError(
            "New password must be at least 8 characters long",
            400
        );
    }

    if (newPassword.length > 72) {
        throw new AppError(
            "New password must not exceed 72 characters",
            400
        );
    }

    if (currentPassword === newPassword) {
        throw new AppError(
            "New password must differ from current password",
            400
        );
    }

    next();
}