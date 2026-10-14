import express from "express";

import { createRoommateRequest } from "../controllers/roommateRequestController.js";
import { authMiddleware } from "../middleware/protect.js";

const router = express.Router();

router.post("/:recipientId",authMiddleware,createRoommateRequest);

export default router;