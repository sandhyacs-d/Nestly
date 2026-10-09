import Property from "../models/property.js";
import { AppError } from "../errors/appError.js";

export async function createProperty(req, res) {
    const {
        title,
        description,
        propertyType,
        price,
        location,
        bedrooms,
        bathrooms,
        kitchen,
        furnished,
        amenities,
        images
    } = req.body;

    const property = await Property.create({
        owner: req.user._id,
        title, description, propertyType, price, location, bedrooms, bathrooms, kitchen, furnished, amenities, images
    });

    return res.status(201).json({ message: "Property created successfully", property });
}

export async function getProperties(req, res) {
    const { page, limit } = req.pagination;

    const skip = (page - 1) * limit;

    const { search, location, propertyType } = req.query;
    const { minPrice, maxPrice } = req.propertyFilters || {};

    const filters = {
        status: "active"
    };

    if (search) {
        const escapedSearch = search.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

        filters.title = {
            $regex: escapedSearch,
            $options: "i"
        };
    }

    if (location) {
        const escapedLocation = location.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

        filters.location = {
            $regex: escapedLocation,
            $options: "i"
        };
    }

    if (propertyType) {
        filters.propertyType = propertyType;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
        filters.price = {};

        if (minPrice !== undefined) {
            filters.price.$gte = minPrice;
        }

        if (maxPrice !== undefined) {
            filters.price.$lte = maxPrice;
        }
    }

    const sortOptions = {
        newest: { createdAt: -1 },
        price_asc: { price: 1 },
        price_desc: { price: -1 }
    };

    const sortBy = sortOptions[req.sortOption] || sortOptions.newest;

    const properties = await Property.find(filters)
        .sort(sortBy)
        .skip(skip)
        .limit(limit);


    const totalProperties = await Property.countDocuments(filters);

    const totalPages = Math.ceil(totalProperties / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return res.status(200).json({
        properties, pagination:
            { page, limit, totalProperties, totalPages, hasNextPage, hasPreviousPage }
    });
}

export async function getPropertyById(req, res) {
    const id = req.params.id;

    const property = await Property.findById(id);

    if (!property) {
        throw new AppError("Property not found", 404);
    }

    return res.status(200).json(property);

}

export async function updateProperty(req, res) {
    const { id } = req.params;

    const property = await Property.findById(id);

    if (!property) {
        throw new AppError("Property not found", 404);
    }

    if (property.owner.toString() !== req.user._id.toString()) {
        throw new AppError("you are not allowed to update this property", 403);
    }

    Object.assign(property, req.body);

    await property.save();

    return res.status(200).json({
        message: "Property updated successfully",
        property
    });
}

export async function deleteProperty(req, res) {
    const { id } = req.params;

    const property = await Property.findById(id);

    if (!property) {
        throw new AppError("Property not found", 404);
    }

    if (property.owner.toString() !== req.user._id.toString()) {
        throw new AppError("you are not allowed to delete this property", 403);
    }

    await property.deleteOne();

    return res.status(200).json({
        message: "Property deleted successfully"
    });
}