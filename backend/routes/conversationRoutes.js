import express from "express";

import { getOrCreateConversation } from "../controllers/conversationController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authMiddleware } from "../middleware/protect.js";

const router = express.Router();

router.post("/:requestId",authMiddleware,asyncHandler(getOrCreateConversation));

export default router;