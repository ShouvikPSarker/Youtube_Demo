import {registerUser , 
    loginuser, 
    logoutuser, 
    AccessRefreshtoken, 
    UpdatePassword, 
    getCurrentUser, 
    UpdateAccount, 
    UpdateAvatar, 
    UpdateCoverImage, 
    getUserChannel, 
    getWatchHistory} from "../Controllers/Users.controller.js";
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
Userrouter.route("/refresh-token").post( AccessRefreshtoken )
Userrouter.route("/change_password").post(verifyuser , UpdatePassword)
Userrouter.route("/getting_user_details").get(verifyuser , getCurrentUser)
Userrouter.route("/updateaccount_details").patch(verifyuser , UpdateAccount)
Userrouter.route ("/avatar_update").patch(verifyuser , upload.single("avatar") , UpdateAvatar)
Userrouter.route("/update_coverimage").patch(verifyuser , upload.single("coverimage") , UpdateCoverImage)
// as we get the details from the params field we have to put it like the it has been called
Userrouter.route("/channel/:username").get(verifyuser , getUserChannel)
Userrouter.route("/watch_history").get(verifyuser , getWatchHistory)



export default Userrouter




