import express from "express";

import { createProperty } from "../controllers/propertyController.js";
import { authorize } from "../middleware/authorize.js";
import { authMiddleware } from "../middleware/protect.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateProperty } from "../middleware/validateProperty.js";

const router = express.Router();

router.post("/",authMiddleware,authorize("owner"),validateProperty,asyncHandler(createProperty));

export default router;