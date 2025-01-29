import Async1Handler from "../Utils/Async1handler.js";
import Async2Handler from "../Utils/Async2handler.js";
import ApiError from "../Utils/ApiError.js";
import { User } from "../Models/User.model.js";
import uploadfile from "../Services/Cloudinary.file.js";
import ApiResponse from "../Utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

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

// To Update the Password
const UpdatePassword = Async2Handler( async ( req , res ) =>{
    //find the user id
    const user = await User.findById(req.user._id)
    // find the passwords
    const { oldpassword , newpassword } = req.body
    // compare the passwords
    const passwordCorrection = await user.comparePassword(oldpassword)
    // if the password is not right
    if(!passwordCorrection){
        throw new ApiError(400 , 
            "Invalid Password"
        )
    }
    // If the Password is right then go forward and save it into database
    user.password = newpassword
    //saving into database only the password field and not other fields should be updated
    const pass = await user.save({validateBeforeSave : false})
    // send Api Response
    return res
    .status(200)
    .json(
        new ApiResponse (
            400,
            "Password Updated Successfully!",
            {}
        )
    )

})

// Getting Current User
const getCurrentUser = Async1Handler(async ( req , res ) => {
    return res
    .status(200)
    .json(
        new ApiResponse(400 , "user fetched successfully" , req.body)
    )
}) 

// Account Details Updation
const UpdateAccount = Async1Handler(async(req , res ) => {
    const {fullname , email} = req.body
    if(!(fullname || email)){
        throw new ApiError (400 , "All details are necessary")
    }
    const data = await User.findByIdAndUpdate(
        req.user?._id ,
        {
            $set : {
                fullname,
                email 
            }
        },
        {new : true}    
    ).select("-password")
    return res
    .status(201)
    .json(
        new ApiResponse(200,
            "Fields are updated successfully",
            data
        )
    )
})
// Avatar Updation
const UpdateAvatar = Async2Handler (async (req , res ) => {
    // finding the file path
    const avatarPath = req.files?.path
    if(!avatarPath){
        throw new ApiError(401 , "path doesn't exist")
    }
    // if found , the path has been updated into cloudinary
    const cloudpath = await uploadfile(avatarPath)
    // if the path doesn't exist
    if(!cloudpath.url){
        throw new ApiError(401 , "File updation Error")
    }
    //Updation in avatar image
    const avatarimage = await User.findByIdAndUpdate(req.user?._id,
        {
            $set : {
                avatar : cloudpath.url
            }
        },
        {new : true}
    ).select("-password")
    // sending Api Response
    return res
    .status(201)
    .json(
        new ApiResponse(
            200 ,
            "Avatar uploaded successfully",
            avatarimage
        )
    )
} )

// CoverImage Updation
const UpdateCoverImage = Async1Handler( async (req , res ) => {
    const coverimagepath = req.file?.path
    if(!coverimagepath){
        throw new ApiError(401 , "Error in coverImage path")
    }
    // if the path has been detected
    const uploadedfile = await uploadfile(coverimagepath)
    if(!uploadedfile.url){
        throw new ApiError(401 , "Error while Updating CoverImage")
    }
    // if the file has been uploaded , then update the database
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                coverimage : uploadedfile.url
            }
        },
        {new : true}    
    ).select("-password")
    // send Api Response
    return res
    .status(200)
    .json(
        new ApiResponse(
            400,
            "Coverimage updated successfully",
            user
        )
    )
})

// Aggregation Pipelininng
const getUserChannel = Async2Handler(async ( req , res )=> {
    // getting the username
    const {username} = req.params
    if(!username?.trim()){
        throw new ApiError(401 , "Username is missing")
    }
    const channel  = await User.aggregate([
        {
            $match :{
                username : username?.toLowerCase()
            }
        },
        // subscriber count
        {
            $lookup : {
                from : "subscribers",
                localField : "_id",
                foreignField : "channel",
                as  : "Subscribers"
            }
        },
        // Subscribed To
        {
            $lookup : {
                from : "subscribers",
                localField : "_id",
                foreignField : "subscription",
                as  : "SubscribeTo"
            }
        },
        // Total values Count
        {
            $addFields : {
                SubscriberCount : {
                    $size : "$Subscribers"
                },
                SubscribedCount : {
                    $size :  "$SubscribeTo"
                },
                // if User is subscribed or not
                isSubscribed : {
                    $cond  : {
                        if : {
                            $in : [req.user?._id , "$Subscribers.subscription"]
                        },
                        then : true,
                        else : false
                    }
                }
            }
        },
        {
           $project : {
                fullname : 1,
                isSubscribed : 1,
                SubscriberCount : 1,
                SubscribedCount : 1,
                avatar : 1,
                coverimage : 1,
                username : 1
           } 
        }
    ])
    if(!channel?.length){
        throw new ApiError ( 404 , " Channel doesn't exist ")
    }
    // response
    return res
    .status(200)
    .json(
        new ApiResponse(
            201,
            "channel is here!",
            channel
        )
    )

})

// watchhistory
const getWatchHistory = Async1Handler( async ( req ,  res ) => {
    const user = await User.aggregate([
        {
            $match : {
                // this will convert the string type ID into MONGODB id 
                _id: new mongoose.Types.ObjectId(req.user._id)
            },
            
        },
        {
            $lookup : {
                from : "videos",
                localField : "watchhistory",
                foreignField  : "_id",
                as : "watchhistory",
                pipeline : [
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner",
                            pipeline  : [
                                {
                                    $project : {
                                        fullname : 1,
                                        username : 1 ,
                                        avatar  : 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields : {
                            owner : {
                                $first : "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            "watchhistory fetched successfully",
            user[0].watchhistory
        )
    )
})


export {
    registerUser , 
    loginuser , 
    logoutuser , 
    AccessRefreshtoken , 
    UpdateAccount , 
    UpdateAvatar ,
    UpdateCoverImage ,
    UpdatePassword , 
    getCurrentUser,
    getUserChannel,
    getWatchHistory
} ;