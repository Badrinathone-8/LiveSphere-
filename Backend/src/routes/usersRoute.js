import express from "express";
import {login,register} from "../controllers/userController.js"
const router=express.Router();
router.post("/login",login);
router.post("/register",register);
//router.post("/add_to_activity");
//router.route("/get_all_activity");


export default router;

