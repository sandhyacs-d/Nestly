
import jwt from "jsonwebtoken";
import User from "../models/user.js";

export async function socketAuth(socket, next) {
    try {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error("Authentication required"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId)
            .select("_id role passwordChangedAt isActive isSuspended");

        if (!user) {
            return next(new Error("Invalid or expired token"));
        }

        if (
            user.passwordChangedAt &&
            decoded.iat <=
            Math.floor(user.passwordChangedAt.getTime() / 1000)
        ) {
            return next(
                new Error("Password changed. Please log in again.")
            );
        }

        if (user.isActive === false) {
            return next(new Error("Your account is deactivated."));
        }

        if (user.isSuspended === true) {
            return next(
                new Error("Your account has been suspended. Please contact support.")
            );
        }

        socket.data.userId = user._id.toString();
        socket.data.role = user.role;

        next();
    } catch (error) {
        console.error("Socket authentication failed:", error.message);
        next(new Error("Invalid or expired token"));
    }
}
