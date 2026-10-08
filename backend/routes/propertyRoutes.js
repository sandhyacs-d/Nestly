import express from "express";

import { createProperty, getProperties, getPropertyById, updateProperty } from "../controllers/propertyController.js";
import { authorize } from "../middleware/authorize.js";
import { authMiddleware } from "../middleware/protect.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateProperty } from "../middleware/validateProperty.js";
import { validatePropertyUpdate } from "../middleware/validatePropertyUpdate.js";

const router = express.Router();

router.post("/",authMiddleware,authorize("owner"),validateProperty,asyncHandler(createProperty));
router.get("/",asyncHandler(getProperties));
router.get("/:id", asyncHandler(getPropertyById));
router.patch("/:id",authMiddleware,authorize("owner"),validatePropertyUpdate,asyncHandler(updateProperty));

export default router;