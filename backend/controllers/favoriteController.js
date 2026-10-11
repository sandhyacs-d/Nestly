import Favorite from "../models/favorites.js";
import Property from "../models/property.js";
import { AppError } from "../errors/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const addFavorite = asyncHandler(async (req, res) => {
    const { propertyId } = req.params;


    const property = await Property.findById(propertyId);

    if (!property) {
        throw new AppError("Property not found", 404);
    }


    if (property.status !== "active") {
        throw new AppError(
            "Cannot favorite a property that is not active",
            400
        );
    }


    const existingFavorite = await Favorite.findOne({
        user: req.user._id,
        property: propertyId
    });

    if (existingFavorite) {
        throw new AppError("Property is already in favorites", 409);
    }


    try {
        const favorite = await Favorite.create({
            user: req.user._id,
            property: propertyId
        });


        res.status(201).json({
            success: true,
            message: "Property added to favorites",
            data: {
                favorite
            }
        });
    } catch (error) {

        if (error.code === 11000) {
            throw new AppError("Property is already in favorites", 409);
        }

        throw error;
    }
});


export const getFavorites = asyncHandler(async (req, res) => {
    const favorites = await Favorite.find({
        user: req.user._id
    }).populate("property");

    res.status(200).json({
        success: true,
        results: favorites.length,
        data: {
            favorites
        }
    });
});


export const removeFavorite = asyncHandler(async (req, res) => {
    const { propertyId } = req.params;

    const favorite = await Favorite.findOneAndDelete({
        user: req.user._id,
        property: propertyId
    });

    if (!favorite) {
        throw new AppError("Favorite not found", 404);
    }

    res.status(200).json({
        success: true,
        message: "Property removed from favorites"
    });
});
