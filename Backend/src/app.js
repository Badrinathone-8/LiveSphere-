import express from "express"
import mongoose from "mongoose"
import {createServer} from "node:http"
import cors from "cors";
import {Server} from "socket.io";
import dotenv from "dotenv";
import router from "../src/routes/usersRoute.js"
//import { useDeferredValue } from "react";
dotenv.config();
const app=express();


//MIDDLEWARES
app.use(cors());
app.use(express.json());

//app.use(urlencoded({extended:true}));
const port=process.env.PORT||8000;
const server=createServer(app);
const io=new Server(server);
const connectDB=async ()=>{
try{
    await mongoose.connect(process.env.MONGO_URL);
console.log("Data base connected ")
}catch(err){
    console.log(err);
}
}
connectDB()
app.use("/api/v1",router);
app.get("/hello",(req,res)=>{
    res.send("Hello ");
})
app.listen(port,()=>{
    console.log("server connected");
})