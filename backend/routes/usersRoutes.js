
import express from "express";
import { changePassword, updateMe } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/protect.js";
import { validateProfileUpdate } from "../middleware/validateProfileUpdate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validatePasswordChange } from "../middleware/validatePasswordChange.js";

const router = express.Router();

router.patch("/me",authMiddleware,validateProfileUpdate,asyncHandler(updateMe));
router.patch("/me/password",authMiddleware,validatePasswordChange,asyncHandler(changePassword));

export default router;
