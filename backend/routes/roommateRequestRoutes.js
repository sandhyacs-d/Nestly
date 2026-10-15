import express from "express";

import { createRoommateRequest, getReceivedRoommateRequests, updateRoommateRequestStatus } from "../controllers/roommateRequestController.js";
import { authMiddleware } from "../middleware/protect.js";

const router = express.Router();

router.post("/:recipientId",authMiddleware,createRoommateRequest);
router.get("/received",authMiddleware,getReceivedRoommateRequests);
router.patch("/:requestId/status",authMiddleware,updateRoommateRequestStatus);

export default router;