import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true
    },
    email : {
        type :String,
        required : true,
        unique : true
    },
    password : {
        type : String,
        required : true
    },
    role : {
        type : String,
        enum : ["renter","owner","admin"],
        default : "renter",
        required : true
    },
    passwordChangedAt:{
        type : Date
    }
})

const User = mongoose.model("User",userSchema);

export default User;