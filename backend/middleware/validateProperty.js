import { AppError } from "../errors/appError.js";

export function validateProperty(req, res, next) {
    if (
        typeof req.body !== "object" ||
        req.body === null ||
        Array.isArray(req.body)
    ) {
        throw new AppError("Request body must be an object", 400);
    }

    const { title, description, propertyType, price, location } = req.body;

    if (title === undefined) {
        throw new AppError("Title is required", 400);
    }

    if (typeof title !== "string") {
        throw new AppError("Title must be a string", 400);
    }

    if (title.trim() === "") {
        throw new AppError("Title must not be empty", 400);
    }

    if (title.trim().length < 2) {
        throw new AppError("Title must be at least 2 characters", 400);
    }

    if (title.trim().length > 100) {
        throw new AppError("Title must not exceed 100 characters", 400);
    }

    req.body.title = title.trim();


    if (description === undefined) {
        throw new AppError("Description is required", 400);
    }

    if (typeof description !== "string") {
        throw new AppError("Description must be a string", 400);
    }

    if (description.trim() === "") {
        throw new AppError("Description must not be empty", 400);
    }

    if (description.trim().length < 10) {
        throw new AppError("Description must be at least 10 characters", 400);
    }

    if (description.trim().length > 1000) {
        throw new AppError("Description must not exceed 1000 characters", 400);
    }

    req.body.description = description.trim();


    if (propertyType === undefined) {
        throw new AppError("Property type is required", 400);
    }

    if (typeof propertyType !== "string") {
        throw new AppError("Property type must be a string", 400);
    }

    if (propertyType.trim() === "") {
        throw new AppError("Property type must not be empty", 400);
    }

    const allowedTypes = ["apartment", "house", "room", "studio"];

    if (!allowedTypes.includes(propertyType.trim())) {
        throw new AppError("Invalid property type", 400);
    }

    req.body.propertyType = propertyType.trim();


    if (price === undefined) {
        throw new AppError("Price is required", 400);
    }

    if (typeof price !== "number") {
        throw new AppError("Price must be a number", 400);
    }

    if (!Number.isFinite(price)) {
        throw new AppError("Price must be a finite number", 400);
    }

    if (price <= 0) {
        throw new AppError("Price must be greater than 0", 400);
    }

    if (price > 10000000) {
        throw new AppError("Price must not exceed 10000000", 400);
    }


    if (location === undefined) {
        throw new AppError("Location is required", 400);
    }

    if (typeof location !== "string") {
        throw new AppError("Location must be a string", 400);
    }

    if (location.trim() === "") {
        throw new AppError("Location must not be empty", 400);
    }

    if (location.trim().length < 2) {
        throw new AppError("Location must be at least 2 characters", 400);
    }

    if (location.trim().length > 200) {
        throw new AppError("Location must not exceed 200 characters", 400);
    }

    req.body.location = location.trim();

    const { bedrooms } = req.body;

    if (bedrooms === undefined) {
        throw new AppError("Bedrooms is required", 400);
    }

    if (typeof bedrooms !== "number") {
        throw new AppError("Bedrooms must be a number", 400);
    }

    if (!Number.isInteger(bedrooms)) {
        throw new AppError("Bedrooms must be an integer", 400);
    }

    if (bedrooms <= 0) {
        throw new AppError("Bedrooms must be greater than 0", 400);
    }

    const { bathrooms } = req.body;

    if (bathrooms === undefined) {
        throw new AppError("Bathrooms is required", 400);
    }

    if (typeof bathrooms !== "number") {
        throw new AppError("Bathrooms must be a number", 400);
    }

    if (!Number.isInteger(bathrooms)) {
        throw new AppError("Bathrooms must be an integer", 400);
    }

    if (bathrooms <= 0) {
        throw new AppError("Bathrooms must be greater than 0", 400);
    }

    const { kitchen, furnished } = req.body;

    if (kitchen !== undefined && typeof kitchen !== "boolean") {
        throw new AppError("Kitchen must be a boolean", 400);
    }

    if (furnished !== undefined && typeof furnished !== "boolean") {
        throw new AppError("Furnished must be a boolean", 400);
    }

    const { amenities } = req.body;

    if (amenities !== undefined) {

        if (!Array.isArray(amenities)) {
            throw new AppError("Amenities must be an array", 400);
        }

        for (const amenity of amenities) {

            if (typeof amenity !== "string") {
                throw new AppError("Each amenity must be a string", 400);
            }

            if (amenity.trim() === "") {
                throw new AppError("Amenity must not be empty", 400);
            }
        }

        req.body.amenities = amenities.map(amenity => amenity.trim());
    }

    const { images } = req.body;

    if (images !== undefined) {

        if (!Array.isArray(images)) {
            throw new AppError("Images must be an array", 400);
        }

        for (const image of images) {

            if (typeof image !== "string") {
                throw new AppError("Each image must be a string", 400);
            }

            if (image.trim() === "") {
                throw new AppError("Image URL must not be empty", 400);
            }

            try {
                new URL(image.trim());
            } catch {
                throw new AppError("Each image must be a valid URL", 400);
            }
        }

        req.body.images = images.map(image => image.trim());
    }

    next();
}