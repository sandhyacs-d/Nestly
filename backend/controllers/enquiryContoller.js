
import Enquiry from "../models/enquiry.js";
import Property from "../models/property.js";
import { AppError } from "../errors/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createEnquiry = asyncHandler(async (req, res) => {
    const { propertyId } = req.params;
    const { message } = req.body;

   
    if (typeof message !== "string" || !message.trim()) {
        throw new AppError("Please provide an enquiry message", 400);
    }

    if (message.trim().length > 1000) {
        throw new AppError("Message cannot exceed 1000 characters", 400);
    }

    
    const property = await Property.findById(propertyId);

    if (!property) {
        throw new AppError("Property not found", 404);
    }

    if (property.status !== "active") {
        throw new AppError(
            "Cannot enquire about a property that is not active",
            400
        );
    }


    if (property.owner.toString() === req.user._id.toString()) {
        throw new AppError(
            "You cannot enquire about your own property",
            403
        );
    }

    
    const existingEnquiry = await Enquiry.findOne({
        renter: req.user._id,
        property: property._id
    });

    if (existingEnquiry) {
        throw new AppError(
            "You have already enquired about this property",
            409
        );
    }

    try {
        const enquiry = await Enquiry.create({
            renter: req.user._id,
            property: property._id,
            owner: property.owner,
            message: message.trim()
        });

        res.status(201).json({
            success: true,
            message: "Enquiry submitted successfully",
            data: {
                enquiry
            }
        });
    } catch (error) {
       
        if (error.code === 11000) {
            throw new AppError(
                "You have already enquired about this property",
                409
            );
        }

        throw error;
    }
});
