import mongoose from "mongoose";

const meetingSchema=new mongoose.Schema({
    user_id:{
        type:String,
        
    },
    meetingcode:{
        type:String,
        required:true,
    },
    date:{
        type:String,
        default:Date.now,required:true,
    }
})
const Meeting=mongoose.model("Meeting",meetingSchema);

export {Meeting};