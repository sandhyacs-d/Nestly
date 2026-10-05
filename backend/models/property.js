import mongoose from "mongoose";

const propertySchema = new mongoose.Schema({
    owner : {
         type : mongoose.Schema.Types.ObjectId,
         ref : "User",
        required : true
    },
    title : {
        type : String,
        required : true
    },
    description : {
        type : String,
        required : true
    },
    propertyType : {
        type : String,
        required : true,
        enum : ["apartment","house","room","studio"]
    },
    price : {
        type : Number,
        required : true
    },
    location : {
        type : String,
        required : true
    },
    bedrooms : {
        type : Number,
        required : true
    },
    bathrooms : {
        type : Number,
        required : true
    },
    kitchen : {
        type : Boolean,
        default : false
    },
    furnished : {
        type : Boolean,
        default : false
    },
    amenities: {
        type : [String],
        default : []
    },
    images: {
        type: [String],
        default: []
    },
    status: {
        type: String,
        enum: ["active", "rented", "inactive"],
        default: "active"
    },
},
    {
        timestamps : true
});

const Property = mongoose.model("Property",propertySchema);

export default Property;