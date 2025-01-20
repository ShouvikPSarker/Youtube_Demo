import {registerUser , loginuser, logoutuser} from "../Controllers/Users.controller.js";
import { Router } from "express";
import { upload } from "../Middleware/multer.middleware.js";
import { verifyuser } from "../Middleware/auth.middleware.js";


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


Userrouter.route("/login").post(loginuser)

Userrouter.route("/logout").post(verifyuser , logoutuser)

export default Userrouter




