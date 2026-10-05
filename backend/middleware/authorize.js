import { AppError } from "../errors/appError.js"

export function authorize(...roles){
    return (req,res,next) => {
        if(!roles.includes(req.user.role)){
            throw new AppError("Forbidden",403);
        }
        next();
    }
    
}