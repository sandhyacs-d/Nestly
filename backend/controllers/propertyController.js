import Property from "../models/property.js";

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