import express from "express";
import { loginUser, registerUser, getMe } from "../controllers/authController.js";
import { validateRegister } from "../middleware/validateRegister.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateLogin } from "../middleware/validateLogin.js";
import { authMiddleware } from "../middleware/protect.js";
import { authLimiter } from "../middleware/rateLimiter.js";


const router = express.Router();


/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account with the default renter role.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 128
 *                 example: Password123
 *     responses:
 *       201:
 *         description: User successfully registered
 *       400:
 *         description: Invalid registration data
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Internal server error
 */

router.post("/register",authLimiter,validateRegister,asyncHandler(registerUser));


/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in a user
 *     description: Authenticates a user and returns a JWT token.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: Password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [renter, owner, admin]
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Invalid email or password
 *       403:
 *         description: Account is suspended or deactivated
 *       500:
 *         description: Internal server error
 */


router.post("/login",authLimiter,validateLogin,asyncHandler(loginUser));


/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     description: Returns the profile of the currently authenticated user.
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Authentication token missing, invalid, or expired
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

router.get("/me",authMiddleware,asyncHandler(getMe));


export default router;