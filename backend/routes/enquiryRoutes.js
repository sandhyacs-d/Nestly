import express from "express";
import { createEnquiry , getSentEnquiries , getReceivedEnquiries, updateEnquiryStatus} from "../controllers/enquiryContoller.js";
import { authMiddleware } from "../middleware/protect.js";

const router = express.Router();

router.post("/:propertyId", authMiddleware, createEnquiry);
router.get("/sent", authMiddleware, getSentEnquiries);
router.get("/received", authMiddleware, getReceivedEnquiries);
router.patch("/:enquiryId/status", authMiddleware, updateEnquiryStatus);

export default router;


