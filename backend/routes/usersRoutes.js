
import express from "express";
import { changePassword, updateMe, deactivateMyAccount, reactivateMyAccount } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/protect.js";
import { validateProfileUpdate } from "../middleware/validateProfileUpdate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validatePasswordChange } from "../middleware/validatePasswordChange.js";

const router = express.Router();


/**
 * @swagger
 * /api/users/me:
 *   patch:
 *     summary: Update user profile
 *     description: Updates the authenticated user's profile information.
 *     tags:
 *       - User Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Profile fields accepted by validateProfileUpdate.
 *             example:
 *               name: Updated Name
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid profile information
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.patch("/me",authMiddleware,validateProfileUpdate,asyncHandler(updateMe));

/**
 * @swagger
 * /api/users/me/password:
 *   patch:
 *     summary: Change password
 *     description: Changes the authenticated user's password.
 *     tags:
 *       - User Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *             example:
 *               currentPassword: OldPassword123
 *               newPassword: NewPassword123
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid password input
 *       401:
 *         description: Current password is incorrect or authentication required
 *       500:
 *         description: Internal server error
 */

router.patch("/me/password",authMiddleware,validatePasswordChange,asyncHandler(changePassword));

/**
 * @swagger
 * /api/users/me/status:
 *   patch:
 *     summary: Deactivate account
 *     description: Deactivates the authenticated user's account.
 *     tags:
 *       - User Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deactivated successfully
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */

router.patch("/me/status",authMiddleware,asyncHandler(deactivateMyAccount));

/**
 * @swagger
 * /api/users/me/reactivate:
 *   post:
 *     summary: Reactivate account
 *     description: Reactivates a deactivated account after verifying the user's email and password. Returns a new JWT.
 *     tags:
 *       - User Profile
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
 *               password:
 *                 type: string
 *                 format: password
 *             example:
 *               email: user@example.com
 *               password: Password123
 *     responses:
 *       200:
 *         description: Account reactivated successfully
 *       400:
 *         description: Missing credentials or account is already active
 *       401:
 *         description: Invalid email or password
 *       403:
 *         description: Account is suspended
 */
router.post("/me/reactivate",asyncHandler(reactivateMyAccount));

export default router;
