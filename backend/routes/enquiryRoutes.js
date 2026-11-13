import express from "express";
import { createEnquiry , getSentEnquiries , getReceivedEnquiries, updateEnquiryStatus} from "../controllers/enquiryController.js";
import { authMiddleware } from "../middleware/protect.js";

const router = express.Router();


/**
 * @swagger
 * /api/enquiries/{propertyId}:
 *   post:
 *     summary: Submit a property enquiry
 *     description: Allows an authenticated renter to enquire about an active property.
 *     tags:
 *       - Enquiries
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB property ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 maxLength: 1000
 *                 example: I am interested in renting this property. Is it still available?
 *     responses:
 *       201:
 *         description: Enquiry submitted successfully
 *       400:
 *         description: Invalid property ID, empty message, or inactive property
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Only renters can submit enquiries or users cannot enquire about their own property
 *       404:
 *         description: Property not found
 *       409:
 *         description: Enquiry already exists for this property
 *       500:
 *         description: Internal server error
 */

router.post("/:propertyId", authMiddleware, createEnquiry);


/**
 * @swagger
 * /api/enquiries/sent:
 *   get:
 *     summary: Get sent enquiries
 *     description: Retrieves all property enquiries submitted by the authenticated renter.
 *     tags:
 *       - Enquiries
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sent enquiries retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 2
 *                 data:
 *                   type: object
 *                   properties:
 *                     enquiries:
 *                       type: array
 *                       items:
 *                         type: object
 *                         description: Enquiry with populated property and owner details
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */

router.get("/sent", authMiddleware, getSentEnquiries);


/**
 * @swagger
 * /api/enquiries/received:
 *   get:
 *     summary: Get received enquiries
 *     description: Retrieves all enquiries received by the authenticated property owner.
 *     tags:
 *       - Enquiries
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Received enquiries retrieved successfully
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
 *                   example: 3
 *                 data:
 *                   type: object
 *                   properties:
 *                     enquiries:
 *                       type: array
 *                       items:
 *                         type: object
 *                         description: Enquiry with populated property and renter details
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */

router.get("/received", authMiddleware, getReceivedEnquiries);


/**
 * @swagger
 * /api/enquiries/{enquiryId}/status:
 *   patch:
 *     summary: Update enquiry status
 *     description: Allows a property owner to accept or reject a pending enquiry.
 *     tags:
 *       - Enquiries
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enquiryId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB enquiry ID
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
 *         description: Enquiry status updated successfully
 *       400:
 *         description: Invalid enquiry ID or status
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Only property owners can update enquiry status
 *       404:
 *         description: Enquiry not found
 *       409:
 *         description: Enquiry has already been processed
 *       500:
 *         description: Internal server error
 */

router.patch("/:enquiryId/status", authMiddleware, updateEnquiryStatus);

export default router;


