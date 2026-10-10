import { AppError } from "../errors/appError.js";
import User from "../models/user.js"
import { generateToken } from "../utils/jwt.js";
import { hashPassword, verifyPassword } from "../utils/password.js";

export async function registerUser(req, res) {
    const { name, email, password } = req.body;


    const existingEmail = await User.findOne({ email });

    if (existingEmail) {
        throw new AppError("Email already exists", 409);
    }

    const hashedPassword = await hashPassword(password);


    await User.create({
        name,
        email,
        password: hashedPassword
    })

    return res.status(201).json({
        message: "User successfully registered"
    })
}

export async function loginUser(req, res) {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        throw new AppError("Invalid email or password", 401);
    }

    const validPassword = await verifyPassword(password, user.password);

    if (!validPassword) {
        throw new AppError("Invalid email or password", 401);
    }


    const token = generateToken(user._id);

    return res.status(200).json({
        message: "Login successful",
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        },
        token
    })

}

export async function getMe(req, res) {
    return res.status(200).json({
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
        }
    })
}


export async function updateMe(req, res) {
    const user = req.user;

    if (req.body.email && req.body.email !== user.email) {
        const existingUser = await User.findOne({
            email: req.body.email
        });

        if (existingUser) {
            throw new AppError("Email is already in use", 409);
        }
    }

    if (req.body.name !== undefined) {
        user.name = req.body.name;
    }

    if (req.body.email !== undefined) {
        user.email = req.body.email;
    }

    await user.save();

    return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
}

export async function changePassword(req, res) {
    const user = await User.findById(req.user._id).select("+password");

    const isCurrentPasswordValid = await verifyPassword(
        req.body.currentPassword,
        user.password
    );

    if (!isCurrentPasswordValid) {
        throw new AppError("Current password is incorrect", 401);
    }

    user.password = await hashPassword(req.body.newPassword);
    user.passwordChangedAt = new Date();
    
    await user.save();

    return res.status(200).json({
        success: true,
        message: "Password changed successfully"
    });
}