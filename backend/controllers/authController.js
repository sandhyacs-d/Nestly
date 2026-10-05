import { AppError } from "../errors/appError.js";
import User from "../models/user.js"
import { generateToken } from "../utils/jwt.js";
import { hashPassword, verifyPassword } from "../utils/password.js";

export async function registerUser(req,res){
    const {name , email, password} = req.body;


    const existingEmail = await User.findOne({email});

    if(existingEmail){
        throw new AppError("Email already exists",409);
    }

    const hashedPassword = await hashPassword(password);


    await User.create({
        name,
        email,
        password : hashedPassword
    })

    return res.status(201).json({
        message : "User successfully registered"
    })
}

export async function loginUser(req,res){
    const { email, password} = req.body;

     const user = await User.findOne({email});

    if(!user){
        throw new AppError("Invalid email or password",401);
    }

    const validPassword = await verifyPassword(password,user.password);

    if(!validPassword){
        throw new AppError("Invalid email or password",401);
    }


    const token =generateToken(user._id);

    return res.status(200).json({
        message : "Login successful",
        user: {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
},
        token
    })

    }

export async function getMe(req,res){
    return res.status(200).json({
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
        }
})
}
