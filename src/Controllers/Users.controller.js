import Async1Handler from "../Utils/Async1handler.js";
import ApiError from "../Utils/ApiError.js";
import { User } from "../Models/User.model.js";
import uploadfile from "../Services/Cloudinary.file.js";
import ApiResponse from "../Utils/ApiResponse.js";

const registerUser = Async1Handler(async (req , res) =>{
    // Get user input from Front_End
    // validate user input
    // check if user is already registered or not
    // check for images & avatar
    // upload images and avatar to cloudinary
    // check again if avatar are uploaded or not
    // create entry in database
    // remove password & refresh token from the response
    // create user

    const {fullname , username , password , email} = await req.body
    
    //validation
    if( [fullname , username , password , email].some(
        (fields) => fields?.trim() === "") )
    {
        throw new ApiError(400 , "Please fill all the fields")
    }

    //checking user if already registered

    const existedUser = User.findOne({
        $or : [{username} , {email}]
    })
    if(existedUser){
        throw new ApiError(409 , "User already exists")
    }

    //check forr images and avatar
    console.log(req.files)
    const avatarlocalpath = req.files?.avatar[0]?.path
    const coverimagelocalpath = req.files?.coverimage[0]?.path

    if(!avatarlocalpath){
        throw new ApiError(402 , "Please upload avatar")
    }
    const avatar = await uploadfile(avatarlocalpath)
    const coverimage = await uploadfile(coverimagelocalpath)

    if(!avatar){
        throw new ApiError(400 , "Avatar file is needed!!")
    }

    //create entry in database

    const user = await User.create({
        fullname,
        avatar : avatar.url,
        coverimage : coverimage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })

    ///remove password and refresh token from the response
    const createduser = User.findById(user._id).select("-password -refreshtoken")
    // User checking and response
    if(!createduser){
        throw new ApiError(500 , "Server Errror !! User not created")
    }

    return await res.status(201).json(
        new ApiResponse (200 , "User registered successfully", createduser
    ))


})

export default registerUser;