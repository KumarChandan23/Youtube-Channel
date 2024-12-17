import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from '../utils/ApiResponse.js'

const registerUser = asyncHandler(async (req, res)=>{
    // 👌res.status(200).json({message:"okay, you are connected to db and getting data"}) // initially you can run only this line of code to check weather your api is working or not
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, emails
    // check for images and avatar
    // upload them to cloudinary
    // create user object - create entry in db
    // remove password and refresh token faild from response
    // check for user creation
    // return response

    const {username, fullname, email, password} = req.body
    /// for single vlaue check
    // for 
    // if(username === ""){
    //     throw new ApiError(400, "Full Name is required")
    // }
    // for multiple value check
    if([username, fullname, email, password].some((field)=> field.trim() === "")){
        throw new ApiError(400, "All fields are required !!")
    }

    const existedUser = User.findOne({
        $or: [ { username }, { email }]
    })

    if(existedUser){
        throw new ApiError(409, "User with email and Username already exists")
    }
   
    const avatarLocalPath = req.files?.avatar[0]?.path; // req.files is given by multer and req.body is given by espress by default
    const coverImageLocalPath = req. files?.coverImage[0]?.path;
    
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is Required !!")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400, "Avatar file is Required");
    }

   const user = await User.create({
        fullname, 
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    
    const createdUser = User.findById(user._id).select(
        "-password -refreshtoken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registring the user")
    }
    
    return req.status(201).json(
        new ApiResponse(200, createdUser,"User Registered Successfully")
    )

} );

export {registerUser}