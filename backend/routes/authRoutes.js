import express from "express";
import { loginUser, registerUser } from "../controllers/authController.js";
import { validateRegister } from "../middleware/validateRegister.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateLogin } from "../middleware/validateLogin.js";


const router = express.Router();

router.post("/register",validateRegister,asyncHandler(registerUser));
router.post("/login",validateLogin,asyncHandler(loginUser));

export default router;