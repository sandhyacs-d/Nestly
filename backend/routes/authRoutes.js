import express from "express";
import { loginUser, registerUser, getMe } from "../controllers/authController.js";
import { validateRegister } from "../middleware/validateRegister.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateLogin } from "../middleware/validateLogin.js";
import { authMiddleware } from "../middleware/protect.js";
import { authorize } from "../middleware/authorize.js";


const router = express.Router();

router.post("/register",validateRegister,asyncHandler(registerUser));
router.post("/login",validateLogin,asyncHandler(loginUser));
router.get("/me",authMiddleware,asyncHandler(getMe));


export default router;