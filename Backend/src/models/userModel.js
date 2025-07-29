import mongoose from "mongoose";

const userSchema=new mongoose.Schema({
name:{
    type:String,
    required:true,

},
username:{
    type:String,
    required:true,

},
password:{
    type:String,

},
token:{
    type:String,

}
})

const User=mongoose.model("User",userSchema);

export  {User};