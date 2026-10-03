import { AppError } from "../errors/appError.js";
import User from "../models/user.js"
import { hashPassword } from "../utils/password.js";

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