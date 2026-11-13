import express from "express";
import { addFavorite , getFavorites, removeFavorite} from "../controllers/favoriteController.js";
import { authMiddleware } from "../middleware/protect.js";

const router = express.Router();


/**
 * @swagger
 * /api/favorites/{propertyId}:
 *   post:
 *     summary: Add a property to favorites
 *     description: Adds an active property to the authenticated user's favorites.
 *     tags:
 *       - Favorites
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB property ID
 *     responses:
 *       201:
 *         description: Property successfully added to favorites
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
 *                   example: Property added to favorites
 *                 data:
 *                   type: object
 *                   properties:
 *                     favorite:
 *                       type: object
 *                       description: Created favorite record
 *       400:
 *         description: Property is not active or property ID is invalid
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Property not found
 *       409:
 *         description: Property is already in favorites
 *       500:
 *         description: Internal server error
 */

router.post("/:propertyId", authMiddleware, addFavorite);


/**
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: Get user's favorite properties
 *     description: Retrieves all properties saved by the authenticated user.
 *     tags:
 *       - Favorites
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Favorites retrieved successfully
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
 *                     favorites:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           user:
 *                             type: string
 *                           property:
 *                             type: object
 *                             description: Populated property details
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */

router.get("/", authMiddleware, getFavorites);


/**
 * @swagger
 * /api/favorites/{propertyId}:
 *   delete:
 *     summary: Remove a property from favorites
 *     description: Removes a property from the authenticated user's favorites.
 *     tags:
 *       - Favorites
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB property ID
 *     responses:
 *       200:
 *         description: Property successfully removed from favorites
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
 *                   example: Property removed from favorites
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Favorite not found
 *       500:
 *         description: Internal server error
 */

router.delete("/:propertyId",authMiddleware, removeFavorite);

export default router;
