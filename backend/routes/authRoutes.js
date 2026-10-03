import express from "express";
import { registerUser } from "../controllers/authController.js";
import { validateRegister } from "../middleware/validateRegister.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const router = express.Router();

router.post("/register",validateRegister,asyncHandler(registerUser));

export default router;