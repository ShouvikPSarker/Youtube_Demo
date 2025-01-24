import { User } from "../Models/User.model.js"
import ApiError from "../Utils/ApiError.js"
import Async1Handler from "../Utils/Async1handler.js"
import jwt from "jsonwebtoken"


export const verifyuser = Async1Handler(async(req , res , next) =>{
    try {
        const token = await req.cookies?.accesstoken || req.header("Authorization")?.replace("Bearer ","") // header request for mobile user
    
        if(!token){
            throw new ApiError(401 , "Unauthorized Access")
        }
    
        const decodetoken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodetoken?._id).select("-password -refreshtoken")
    
        if(!user){
            throw new ApiError(401 , "Bad Request!!")
        }
        req.user = user
        next()
        
    } catch (error) {
        throw new ApiError(401 , "Invalid Access!")
    }

})