
import RoommateProfile from "../models/roommateProfile.js";
import { AppError } from "../errors/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

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
        throw new AppError("Preferred location, minimum budget, and maximum budget are required", 400);
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
            "You already have a roommate profile", 409
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


export const discoverRoommates = asyncHandler(async (req, res) => {

    const {
        location,
        budgetMin,
        budgetMax,
        lifestyle,
        page = "1",
        limit = "10"
    } = req.query;


    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    if (
        !Number.isInteger(pageNumber) ||
        !Number.isInteger(limitNumber) ||
        pageNumber < 1 ||
        limitNumber < 1 ||
        limitNumber > 50
    ) {
        throw new AppError(
            "Page must be a positive integer and limit must be between 1 and 50",
            400
        );
    }

    const skip = (pageNumber - 1) * limitNumber;

    const query = {
        user: { $ne: req.user._id },
        isActive: true
    };

    if (location !== undefined) {
        if (
            typeof location !== "string" ||
            !location.trim() ||
            location.length > 100
        ) {
            throw new AppError("Invalid location filter", 400);
        }

        query.preferredLocation = {
            $regex: location.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            $options: "i"
        };
    }

    if (lifestyle !== undefined) {
        if (
            typeof lifestyle !== "string" ||
            !lifestyle.trim() ||
            lifestyle.length > 50
        ) {
            throw new AppError("Invalid lifestyle filter", 400);
        }

        query.lifestyle = {
            $regex: lifestyle.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            $options: "i"
        };
    }

    if (budgetMin !== undefined || budgetMax !== undefined) {
        if (
            (budgetMin !== undefined && budgetMin.trim() === "") ||
            (budgetMax !== undefined && budgetMax.trim() === "")
        ) {
            throw new AppError("Budget values cannot be empty", 400);
        }

        const min = budgetMin !== undefined ? Number(budgetMin) : 0;
        const max = budgetMax !== undefined
            ? Number(budgetMax)
            : Number.MAX_SAFE_INTEGER;

        if (
            !Number.isFinite(min) ||
            !Number.isFinite(max) ||
            min < 0 ||
            max < min
        ) {
            throw new AppError("Invalid budget range", 400);
        }

        query.budgetMin = { $lte: max };
        query.budgetMax = { $gte: min };
    }

    const [profiles, total] = await Promise.all([
        RoommateProfile.find(query)
            .select("-__v")
            .populate("user", "name")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNumber),

        RoommateProfile.countDocuments(query)
    ]);

    res.status(200).json({
        success: true,
        results: profiles.length,
        total,
        pagination: {
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(total / limitNumber)
        },
        data: { profiles }
    });
});
