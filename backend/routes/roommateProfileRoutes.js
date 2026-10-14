
import express from "express";
import {
    createRoommateProfile,
    updateRoommateProfile,
    discoverRoommates
} from "../controllers/roommateProfileController.js";
import { authMiddleware } from "../middleware/protect.js";

const router = express.Router();

router.post("/", authMiddleware, createRoommateProfile);
router.patch("/", authMiddleware, updateRoommateProfile);
router.get("/discover", authMiddleware, discoverRoommates);

export default router;
