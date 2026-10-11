import express from "express";
import { addFavorite , getFavorites, removeFavorite} from "../controllers/favoriteController.js";
import { authMiddleware } from "../middleware/protect.js";

const router = express.Router();

router.post("/:propertyId", authMiddleware, addFavorite);
router.get("/", authMiddleware, getFavorites);
router.delete("/:propertyId",authMiddleware, removeFavorite);

export default router;
