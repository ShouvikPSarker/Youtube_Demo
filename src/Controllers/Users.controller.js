import Async1Handler from "../Utils/Async1handler.js";
import Async2Handler from "../Utils/Async2handler.js";
import ApiError from "../Utils/ApiError.js";
import { User } from "../Models/User.model.js";
import uploadfile from "../Services/Cloudinary.file.js";
import ApiResponse from "../Utils/ApiResponse.js";
import jwt from "jsonwebtoken"

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

    const existedUser = await User.findOne({
        $or : [{username} , {email}]
    })
    if(existedUser){
        throw new ApiError(409 , "User already exists")
    }

    //check forr images and avatar
    console.log(req.files)
    const avatarlocalpath = req.files?.avatar[0]?.path
    // const coverimagelocalpath = req.files?.coverimage[0]?.path

    let coverimagelocalpath;
    if(req.files && Array.isArray(req.files.coverimage) && req.files.coverimage.length > 0){
        coverimagelocalpath = req.files.coverimage[0].path
    }

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
    const createduser = await User.findById(user._id).select("-password -refreshtoken")
    // console.log("here it is :",createduser)
    // User checking and response
    if(!createduser){
        throw new ApiError(500 , "Server Errror !! User not created")
    }

    return await res.status(201).json(
        new ApiResponse(201 , "User created successfully" , createduser)
    )


})

const generatetokens = async (userid) =>{
    try {
        const user = await User.findById(userid)
        const accesstoken = user.generateAccessToken()
        const refreshtoken = user.generateRefreshToken()

        user.refreshtoken  = refreshtoken
        await user.save({validateBeforeSave : false})
        
        return { accesstoken , refreshtoken }

    } catch (error) {
        throw new ApiError (500 , "Something went wrong" ,error) 
    }
}

const loginuser = Async2Handler(async (req , res) =>{
    //get the details from the user
    //username and email
    //find the user
    //access and refresh token
    // send cookie

    const{ username , email , password } = await req.body

    if(!(username || email)){
        throw new ApiError(400 , "Please provide username or email")
    }
    //validation
    const user = await User.findOne({
        $or : [{username} , {email}]
    })

    if(!user){
        throw new ApiError(404 , "User not found")
    }
    // password checking
    const passwordcheck = await user.comparePassword(password)
    if(!passwordcheck){
        throw new ApiError(401 , "Invalid User Credentials")
    }
    
    //access and refresh token

    const {accesstoken , refreshtoken} = await generatetokens(user._id)
    
    const userdata = await User.findById(user._id).select("-password -refreshtoken")
    
    //cookies setup
    
    const options = {
        httpOnly : true,
        secure : true
    }
    
    return await res.status(200).cookie("accesstoken",accesstoken , options).cookie("refreshtoken" , refreshtoken , options).json(
        new ApiResponse(
            200 , 
            "Successfully LoggedIn",
            {
                user : accesstoken , refreshtoken , userdata
            }
        )
    )
    

})

const logoutuser = Async1Handler( async ( req , res ) => {
    await User.findByIdAndUpdate(req.user._id , 
        {
            $set : {
                refreshtoken : undefined
            }
        }
    )
    const options = {
        httpOnly : true,
        secure : true
    }

    return await res.status(200)
    .clearCookie("accesstoken" , options)
    .clearCookie("refreshtoken" ,options)
    .json(
         new ApiResponse (200 , "USer LoggedOut" , {})
    )
})

// this controller is used for expired access token and login the user based upon the refresh Token
const AccessRefreshtoken =  Async1Handler( async ( req , res ) =>{
    const incomingRefreshToken = req.cookie(refreshtoken) || req.body(refreshtoken)
    // checking the incoming token status
    if(!incomingRefreshToken){
        throw new ApiError ( 401 , "Invalid Refresh Token!")
    }
    // if passed then decode it and for security and any crash issues do it in try catch block 
    try {
        const decodedtoken = jwt.verify(
            incomingRefreshToken , 
            process.env.REFRESH_TOKEN_SECRET
        )
        // if decoded token is recieved , find the User by _id
        const user = await User.findById(decodedtoken?._id)
        // finding the userID check the database stored refresh token and the incoming refresh token 
            // if the user is not Found
            if(!user){
                throw new ApiError(
                    401,
                    "Invalid UserToken!!"
                )
            }
        if(incomingRefreshToken !== user?.refreshtoken){
            throw new ApiError(
                401,
                "Refresh token is Expired"
            )
        }
        //if the tokens are matched , generateTokens to Login
            // create options for cookies
            const options = {
                httpOnly : true,
                secure : true
            }
        const { accesstoken , createdRefreshtoken } = await generatetokens(user._id)
        // sending the Api Response
        return res
        .cookie("accesstoken" , accesstoken , options)
        .cookie("refreshtoken" , createdRefreshtoken , options)
        .json(
            new ApiResponse(
                201,
                "User Refreshed!",
                {
                    accesstoken,
                    "refreshtoken" : createdRefreshtoken 
                }
            )
        )

    } catch (error) {
        throw new ApiError(
            401 ,
            error?.message || "Invalid Request"
        )
    } 

})




export {registerUser , loginuser , logoutuser , AccessRefreshtoken} ;