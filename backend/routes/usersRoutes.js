
import express from "express";
import { changePassword, updateMe, deactivateMyAccount, reactivateMyAccount } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/protect.js";
import { validateProfileUpdate } from "../middleware/validateProfileUpdate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validatePasswordChange } from "../middleware/validatePasswordChange.js";

const router = express.Router();

router.patch("/me",authMiddleware,validateProfileUpdate,asyncHandler(updateMe));
router.patch("/me/password",authMiddleware,validatePasswordChange,asyncHandler(changePassword));
router.patch("/me/status",authMiddleware,asyncHandler(deactivateMyAccount));
router.post("/me/reactivate",asyncHandler(reactivateMyAccount));

export default router;
