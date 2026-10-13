
import express from "express";
import {
    createRoommateProfile,
    updateRoommateProfile
} from "../controllers/roommateProfileController.js";
import { authMiddleware } from "../middleware/protect.js";

const router = express.Router();

router.post("/", authMiddleware, createRoommateProfile);
router.patch("/", authMiddleware, updateRoommateProfile);

export default router;
