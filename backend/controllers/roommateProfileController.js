
import RoommateProfile from "../models/roommateProfile.js";
import { AppError } from "../errors/appError.js";
import  { asyncHandler } from "../utils/asyncHandler.js";

export const createRoommateProfile = asyncHandler(async (req, res) => {
    if (req.user.role !== "renter") {
        throw new AppError("Only renters can create roommate profiles", 403);
    }

    const {
        bio,
        preferredLocation,
        budgetMin,
        budgetMax,
        occupation,
        lifestyle,
        moveInDate
    } = req.body;

    // Validate required fields
    if (
        typeof preferredLocation !== "string" ||
        !preferredLocation.trim() ||
        budgetMin === undefined ||
        budgetMax === undefined
    ) {
        throw new AppError("Preferred location, minimum budget, and maximum budget are required",400);
    }

    // Validate budget values
    if (
        !Number.isFinite(budgetMin) ||
        !Number.isFinite(budgetMax) ||
        budgetMin < 0 ||
        budgetMax < budgetMin
    ) {
        throw new AppError("Invalid budget range", 400);
    }

    const existingProfile = await RoommateProfile.findOne({
        user: req.user._id
    });

    if (existingProfile) {
        throw new AppError(
            "You already have a roommate profile",409
        );
    }

    const profile = await RoommateProfile.create({
        user: req.user._id,
        bio,
        preferredLocation: preferredLocation.trim(),
        budgetMin,
        budgetMax,
        occupation,
        lifestyle,
        moveInDate
    });

    res.status(201).json({
        success: true,
        message: "Roommate profile created successfully",
        data: { profile }
    });
});


export const updateRoommateProfile = asyncHandler(async (req, res) => {
    if (req.user.role !== "renter") {
        throw new AppError("Only renters can update roommate profiles", 403);
    }

    const {
        bio,
        preferredLocation,
        budgetMin,
        budgetMax,
        occupation,
        lifestyle,
        moveInDate,
        isActive
    } = req.body;


    const profile = await RoommateProfile.findOne({
        user: req.user._id
    });

    if (!profile) {
        throw new AppError("Roommate profile not found", 404);
    }

    
    if (bio !== undefined) profile.bio = bio;
    if (preferredLocation !== undefined) {
        profile.preferredLocation = preferredLocation;
    }
    if (budgetMin !== undefined) profile.budgetMin = budgetMin;
    if (budgetMax !== undefined) profile.budgetMax = budgetMax;
    if (occupation !== undefined) profile.occupation = occupation;
    if (lifestyle !== undefined) profile.lifestyle = lifestyle;
    if (moveInDate !== undefined) profile.moveInDate = moveInDate;
    if (isActive !== undefined) profile.isActive = isActive;

    await profile.validate();

    await profile.save();

    res.status(200).json({
        success: true,
        message: "Roommate profile updated successfully",
        data: { profile }
    });
});
