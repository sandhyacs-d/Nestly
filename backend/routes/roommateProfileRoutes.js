
import express from "express";
import {
    createRoommateProfile,
    updateRoommateProfile,
    discoverRoommates
} from "../controllers/roommateProfileController.js";
import { authMiddleware } from "../middleware/protect.js";

const router = express.Router();


/**
 * @swagger
 * /api/roommate-profiles:
 *   post:
 *     summary: Create a roommate profile
 *     description: Creates a roommate profile for the authenticated renter.
 *     tags:
 *       - Roommate Profiles
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - preferredLocation
 *               - budgetMin
 *               - budgetMax
 *             properties:
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *                 example: Looking for a friendly and responsible roommate.
 *               preferredLocation:
 *                 type: string
 *                 example: Kathmandu
 *               budgetMin:
 *                 type: number
 *                 minimum: 0
 *                 example: 5000
 *               budgetMax:
 *                 type: number
 *                 minimum: 0
 *                 example: 12000
 *               occupation:
 *                 type: string
 *                 example: Student
 *               lifestyle:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [Non-smoker, Clean, Quiet]
 *               moveInDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-12-01"
 *     responses:
 *       201:
 *         description: Roommate profile created successfully
 *       400:
 *         description: Invalid profile data or budget range
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Only renters can create roommate profiles
 *       409:
 *         description: Roommate profile already exists
 *       500:
 *         description: Internal server error
 */

router.post("/", authMiddleware, createRoommateProfile);


/**
 * @swagger
 * /api/roommate-profiles:
 *   patch:
 *     summary: Update roommate profile
 *     description: Updates the authenticated renter's existing roommate profile.
 *     tags:
 *       - Roommate Profiles
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *               preferredLocation:
 *                 type: string
 *                 example: Pokhara
 *               budgetMin:
 *                 type: number
 *                 minimum: 0
 *               budgetMax:
 *                 type: number
 *                 minimum: 0
 *               occupation:
 *                 type: string
 *               lifestyle:
 *                 type: array
 *                 items:
 *                   type: string
 *               moveInDate:
 *                 type: string
 *                 format: date
 *               isActive:
 *                 type: boolean
 *                 description: Controls whether the profile appears in roommate discovery.
 *     responses:
 *       200:
 *         description: Roommate profile updated successfully
 *       400:
 *         description: Invalid profile data or budget range
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Only renters can update roommate profiles
 *       404:
 *         description: Roommate profile not found
 *       500:
 *         description: Internal server error
 */

router.patch("/", authMiddleware, updateRoommateProfile);


/**
 * @swagger
 * /api/roommate-profiles/discover:
 *   get:
 *     summary: Discover roommate profiles
 *     description: Retrieves active roommate profiles belonging to other users, with filtering and pagination.
 *     tags:
 *       - Roommate Profiles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Filter by preferred location
 *       - in: query
 *         name: budgetMin
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Minimum budget to match
 *       - in: query
 *         name: budgetMax
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Maximum budget to match
 *       - in: query
 *         name: lifestyle
 *         schema:
 *           type: string
 *           maxLength: 50
 *         description: Filter by lifestyle preference
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *     responses:
 *       200:
 *         description: Roommate profiles retrieved successfully
 *       400:
 *         description: Invalid filters, budget range, or pagination
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */

router.get("/discover", authMiddleware, discoverRoommates);

export default router;
