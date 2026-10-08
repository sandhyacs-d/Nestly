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
    const properties = await Property.find({ status: "active" });

    return res.status(200).json(properties);
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