import express from "express";

import { getMessages, getOrCreateConversation, sendMessage } from "../controllers/conversationController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authMiddleware } from "../middleware/protect.js";

const router = express.Router();

router.post("/:requestId",authMiddleware,asyncHandler(getOrCreateConversation));
router.post("/:conversationId/messages",authMiddleware,asyncHandler(sendMessage));
router.get("/:conversationId/messages",authMiddleware,asyncHandler(getMessages));

export default router;