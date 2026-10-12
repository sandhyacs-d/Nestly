import express from "express";
import { createEnquiry } from "../controllers/enquiryContoller.js";
import { authMiddleware } from "../middleware/protect.js";

const router = express.Router();

router.post("/:propertyId", authMiddleware, createEnquiry);

export default router;


