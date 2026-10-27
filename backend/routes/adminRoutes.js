
import express from "express";
import { getAllUsers, getUserById, setUserSuspensionStatus, updateUserRole } from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/protect.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authorize } from "../middleware/authorize.js";


const router = express.Router();

router.get("/users", authMiddleware, authorize("admin"), asyncHandler(getAllUsers));
router.get("/users/:id",authMiddleware,authorize("admin"),asyncHandler(getUserById));
router.patch("/users/:id/role",authMiddleware,authorize("admin"),asyncHandler(updateUserRole));
router.patch("/users/:id/status",authMiddleware,authorize("admin"),asyncHandler(setUserSuspensionStatus));

export default router;
