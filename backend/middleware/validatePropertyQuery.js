import { AppError } from "../errors/appError.js";

export function validateQuery(req, res, next) {
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    if (!Number.isInteger(pageNumber)) {
        throw new AppError("page number must be an integer", 400);
    }

    if (pageNumber <= 0) {
        throw new AppError("page number must be greated than 0", 400);
    }

    if (!Number.isInteger(limitNumber)) {
        throw new AppError("limit must be an integer", 400);
    }

    if (limitNumber <= 0) {
        throw new AppError("limit number must be greated than 0", 400);
    }

    if (limitNumber > 100) {
        throw new AppError("limit must not exceed 100", 400);
    }

    req.pagination = {
        page: pageNumber,
        limit: limitNumber
    }

    if (req.query.search !== undefined) {
        const { search } = req.query;

        if (typeof search !== "string") {
            throw new AppError("Search must be a string", 400);
        }

        if (search.trim() === "") {
            throw new AppError("Search must not be empty", 400);
        }

        if (search.trim().length > 100) {
            throw new AppError("Search must not exceed 100 characters", 400);
        }

        req.query.search = search.trim();
    }

    if (req.query.location !== undefined) {
        const { location } = req.query;

        if (typeof location !== "string") {
            throw new AppError("Location must be a string", 400);
        }

        if (location.trim() === "") {
            throw new AppError("Location must not be empty", 400);
        }

        if (location.trim().length > 100) {
            throw new AppError("Location must not exceed 100 characters", 400);
        }

        req.query.location = location.trim();
    }

    if (req.query.propertyType !== undefined) {
        const { propertyType } = req.query;

        const allowedTypes = ["apartment", "house", "room", "studio"];

        if (typeof propertyType !== "string") {
            throw new AppError("Property type must be a string", 400);
        }

        const trimmedType = propertyType.trim();

        if (!allowedTypes.includes(trimmedType)) {
            throw new AppError("Invalid property type", 400);
        }

        req.query.propertyType = trimmedType;
    }

    const priceFilters = {};

    for (const key of ["minPrice", "maxPrice"]) {
        if (req.query[key] !== undefined) {
            const value = req.query[key];

            if (typeof value !== "string" || value.trim() === "") {
                throw new AppError(`${key} must be a valid number`, 400);
            }

            const price = Number(value);

            if (!Number.isFinite(price) || price < 0) {
                throw new AppError(`${key} must be a non-negative number`, 400);
            }

            priceFilters[key] = price;
        }
    }

    if (
        priceFilters.minPrice !== undefined &&
        priceFilters.maxPrice !== undefined &&
        priceFilters.minPrice > priceFilters.maxPrice
    ) {
        throw new AppError("minPrice must not exceed maxPrice", 400);
    }

    req.propertyFilters = {
        ...(req.propertyFilters || {}),
        ...priceFilters
    };

    const { sort = "newest" } = req.query;

    const allowedSortOptions = [
        "newest",
        "price_asc",
        "price_desc"
    ];

    if (typeof sort !== "string" || !allowedSortOptions.includes(sort)) {
        throw new AppError("Invalid sort option", 400);
    }

    req.sortOption = sort;

    next();
}