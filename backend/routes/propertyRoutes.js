import express from "express";

import { createProperty, deleteProperty, getProperties, getPropertyById, updateProperty } from "../controllers/propertyController.js";
import { authorize } from "../middleware/authorize.js";
import { authMiddleware } from "../middleware/protect.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateProperty } from "../middleware/validateProperty.js";
import { validatePropertyUpdate } from "../middleware/validatePropertyUpdate.js";
import { validateQuery } from "../middleware/validatePropertyQuery.js";

const router = express.Router();


/**
 * @swagger
 * /api/properties:
 *   post:
 *     summary: Create a property listing
 *     description: Creates a property listing. Only authenticated users with the owner role can create properties.
 *     tags:
 *       - Properties
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - propertyType
 *               - price
 *               - location
 *               - bedrooms
 *               - bathrooms
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: Spacious Apartment
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *                 example: A spacious apartment near the city center.
 *               propertyType:
 *                 type: string
 *                 enum: [apartment, house, room, studio]
 *                 example: apartment
 *               price:
 *                 type: number
 *                 exclusiveMinimum: 0
 *                 maximum: 10000000
 *                 example: 15000
 *               location:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 200
 *                 example: Kathmandu, Nepal
 *               bedrooms:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *               bathrooms:
 *                 type: integer
 *                 minimum: 1
 *                 example: 1
 *               kitchen:
 *                 type: boolean
 *                 example: true
 *               furnished:
 *                 type: boolean
 *                 example: true
 *               amenities:
 *                 type: array
 *                 maxItems: 30
 *                 items:
 *                   type: string
 *                 example: [WiFi, Parking, Water]
 *               images:
 *                 type: array
 *                 maxItems: 10
 *                 items:
 *                   type: string
 *                   format: uri
 *                 example: ["https://example.com/property.jpg"]
 *     responses:
 *       201:
 *         description: Property created successfully
 *       400:
 *         description: Invalid property data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Only property owners can create listings
 *       500:
 *         description: Internal server error
 */

router.post("/", authMiddleware, authorize("owner"), validateProperty, asyncHandler(createProperty));


/**
 * @swagger
 * /api/properties:
 *   get:
 *     summary: Get all active properties
 *     description: Retrieves active property listings with filtering, sorting, and pagination.
 *     tags:
 *       - Properties
 *     parameters:
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
 *           maximum: 100
 *           default: 10
 *         description: Number of properties per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search properties by title
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Filter by location
 *       - in: query
 *         name: propertyType
 *         schema:
 *           type: string
 *           enum: [apartment, house, room, studio]
 *         description: Filter by property type
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Minimum price
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Maximum price
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, price_asc, price_desc]
 *           default: newest
 *         description: Sorting order
 *     responses:
 *       200:
 *         description: Properties retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Internal server error
 */

router.get("/", validateQuery, asyncHandler(getProperties));


/**
 * @swagger
 * /api/properties/{id}:
 *   get:
 *     summary: Get property by ID
 *     description: Retrieves the details of a specific property.
 *     tags:
 *       - Properties
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB property ID
 *     responses:
 *       200:
 *         description: Property retrieved successfully
 *       400:
 *         description: Invalid property ID
 *       404:
 *         description: Property not found
 *       500:
 *         description: Internal server error
 */

router.get("/:id", asyncHandler(getPropertyById));


/**
 * @swagger
 * /api/properties/{id}:
 *   patch:
 *     summary: Update a property listing
 *     description: Updates selected fields of a property. Only its owner can update it.
 *     tags:
 *       - Properties
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *             minProperties: 1
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: Updated Apartment
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *                 example: Updated property description.
 *               propertyType:
 *                 type: string
 *                 enum: [apartment, house, room, studio]
 *               price:
 *                 type: number
 *                 exclusiveMinimum: 0
 *                 maximum: 10000000
 *                 example: 18000
 *               location:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 200
 *                 example: Lalitpur, Nepal
 *               bedrooms:
 *                 type: integer
 *                 minimum: 1
 *               bathrooms:
 *                 type: integer
 *                 minimum: 1
 *               kitchen:
 *                 type: boolean
 *               furnished:
 *                 type: boolean
 *               amenities:
 *                 type: array
 *                 maxItems: 30
 *                 items:
 *                   type: string
 *               images:
 *                 type: array
 *                 maxItems: 10
 *                 items:
 *                   type: string
 *                   format: uri
 *     responses:
 *       200:
 *         description: Property updated successfully
 *       400:
 *         description: Invalid update data or property ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: You are not allowed to update this property
 *       404:
 *         description: Property not found
 *       500:
 *         description: Internal server error
 */

router.patch("/:id", authMiddleware, authorize("owner"), validatePropertyUpdate, asyncHandler(updateProperty));



/**
 * @swagger
 * /api/properties/{id}:
 *   delete:
 *     summary: Delete a property listing
 *     description: Deletes a property listing. Only its owner can delete it.
 *     tags:
 *       - Properties
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB property ID
 *     responses:
 *       200:
 *         description: Property deleted successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: You are not allowed to delete this property
 *       404:
 *         description: Property not found
 *       500:
 *         description: Internal server error
 */

router.delete("/:id", authMiddleware, authorize("owner"), asyncHandler(deleteProperty));

export default router;