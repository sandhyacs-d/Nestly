import express from "express";

import { createRoommateRequest, getReceivedRoommateRequests, updateRoommateRequestStatus } from "../controllers/roommateRequestController.js";
import { authMiddleware } from "../middleware/protect.js";

const router = express.Router();


/**
 * @swagger
 * /api/roommate-requests/{recipientId}:
 *   post:
 *     summary: Send a roommate request
 *     description: Sends a roommate request to another renter with an active roommate profile.
 *     tags:
 *       - Roommate Requests
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recipientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the recipient user
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 maxLength: 1000
 *                 example: Hi! I am interested in being roommates.
 *     responses:
 *       201:
 *         description: Roommate request sent successfully
 *       400:
 *         description: Invalid recipient ID, self-request, or message
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Only renters can send roommate requests
 *       404:
 *         description: Recipient has no active roommate profile
 *       409:
 *         description: Request already sent to this renter
 *       500:
 *         description: Internal server error
 */

router.post("/:recipientId",authMiddleware,createRoommateRequest);


/**
 * @swagger
 * /api/roommate-requests/received:
 *   get:
 *     summary: Get received roommate requests
 *     description: Retrieves roommate requests received by the authenticated renter.
 *     tags:
 *       - Roommate Requests
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Received roommate requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 results:
 *                   type: integer
 *                   example: 2
 *                 data:
 *                   type: object
 *                   properties:
 *                     requests:
 *                       type: array
 *                       items:
 *                         type: object
 *                         description: Roommate request with populated sender details
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Only renters can view roommate requests
 *       500:
 *         description: Internal server error
 */

router.get("/received",authMiddleware,getReceivedRoommateRequests);


/**
 * @swagger
 * /api/roommate-requests/{requestId}/status:
 *   patch:
 *     summary: Update roommate request status
 *     description: Allows the recipient to accept or reject a pending roommate request.
 *     tags:
 *       - Roommate Requests
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB roommate request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [accepted, rejected]
 *                 example: accepted
 *     responses:
 *       200:
 *         description: Roommate request status updated successfully
 *       400:
 *         description: Invalid request ID or status
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Only renters can update roommate requests
 *       404:
 *         description: Roommate request not found or does not belong to the recipient
 *       409:
 *         description: Request has already been processed
 *       500:
 *         description: Internal server error
 */

router.patch("/:requestId/status",authMiddleware,updateRoommateRequestStatus);

export default router;