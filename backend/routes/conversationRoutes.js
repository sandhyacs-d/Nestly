import express from "express";

import { getMessages, getOrCreateConversation, sendMessage } from "../controllers/conversationController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authMiddleware } from "../middleware/protect.js";

const router = express.Router();


/**
 * @swagger
 * /api/conversations/{requestId}:
 *   post:
 *     summary: Create or retrieve a conversation
 *     description: Creates a conversation for an accepted roommate request, or retrieves the existing conversation.
 *     tags:
 *       - Conversations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB roommate request ID
 *     responses:
 *       201:
 *         description: Conversation created successfully
 *       200:
 *         description: Existing conversation retrieved successfully
 *       400:
 *         description: Invalid roommate request ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Not a participant or roommate request has not been accepted
 *       404:
 *         description: Roommate request not found
 *       500:
 *         description: Internal server error
 */

router.post("/:requestId",authMiddleware,asyncHandler(getOrCreateConversation));


/**
 * @swagger
 * /api/conversations/{conversationId}/messages:
 *   post:
 *     summary: Send a message
 *     description: Sends a message to a conversation. The authenticated user must be a participant.
 *     tags:
 *       - Messaging
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB conversation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 2000
 *                 example: Hi! Thanks for accepting my roommate request.
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Invalid conversation ID or message content
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not a participant or account is not authorized
 *       404:
 *         description: Conversation not found
 *       500:
 *         description: Internal server error
 */

router.post("/:conversationId/messages",authMiddleware,asyncHandler(sendMessage));


/**
 * @swagger
 * /api/conversations/{conversationId}/messages:
 *   get:
 *     summary: Get conversation message history
 *     description: Retrieves messages in chronological order with pagination. Only conversation participants can access the history.
 *     tags:
 *       - Messaging
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB conversation ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Number of messages per page
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Messages retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           conversation:
 *                             type: string
 *                           sender:
 *                             type: string
 *                           content:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalMessages:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       400:
 *         description: Invalid conversation ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not a conversation participant
 *       404:
 *         description: Conversation not found
 *       500:
 *         description: Internal server error
 */

router.get("/:conversationId/messages",authMiddleware,asyncHandler(getMessages));

export default router;