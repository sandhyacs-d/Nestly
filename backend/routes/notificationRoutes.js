
import express from "express";
import {
    getNotifications,
    markNotificationAsRead
} from "../controllers/notificationController.js";
import { authMiddleware } from "../middleware/protect.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.get("/", authMiddleware, asyncHandler(getNotifications));
router.patch("/:notificationId/read", authMiddleware, asyncHandler(markNotificationAsRead));

export default router;
