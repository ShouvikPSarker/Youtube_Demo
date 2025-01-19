import {registerUser} from "../Controllers/Users.controller.js";
import { Router } from "express";
import { upload } from "../Middleware/multer.middleware.js";


const Userrouter = Router();

Userrouter.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxcount : 1
        }, 
        {
            name : "coverimage",
            maxcount : 1
        }
    ]),
    registerUser
)

export default Userrouter