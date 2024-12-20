import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndrefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token");
    }
};

const registerUser = asyncHandler(async (req, res) => {
    // 👌res.status(200).json({message:"okay, you are connected to db and getting data"}) // initially you can run only this line of code to check weather your api is working or not
    // get user details from frontend
    // validation - not empty
    // check if user already exists: userName, emails
    // check for images and avatar
    // upload them to cloudinary
    // create user object - create entry in db
    // remove password and refresh token faild from response
    // check for user creation
    // return response

    const { userName, fullName, email, password } = req.body

    if (![userName, fullName, email, password].every(field => field && field.trim() !== "")) {
        throw new ApiError(400, "All fields are required and cannot be empty or whitespace only.");
    }

    const existedUser = await User.findOne({
        $or: [{ userName }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email and userName already exists")
    }
    const avatarLocalPath = req.files?.avatar[0]?.path; // req.files is given by multer and req.body is given by espress by default

    let coverImageLocalPath;
    if (req.files?.coverImage && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is Required !!")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    // const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;
    if (!avatar) {
        throw new ApiError(400, "Avatar file is Required");
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        userName: userName.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registring the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully")
    )

});

const loginUser = asyncHandler(async (req, res) => {
    const { email, userName, password } = req.body;

    if (!email && !userName) {
        throw new ApiError(400, "userName or email is required");
    }

    const user = await User.findOne({ $or: [{ email }, { userName }] }).select("+password");
    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndrefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    };

    res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in successfully...."
        ));
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id,
        { $set: { refreshToken: undefined } },
        { new: true }
    )

    const option = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
        .clearCookie("accessToken", option)
        .clearCookie("refreshToken", option)
        .json(new ApiResponse(200, {}, "User Logged out"))

})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }
    try {

        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(400, "Refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        };

        const { accessToken, newRefreshToken } = await generateAccessAndrefreshToken(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, option)
            .cookie("refreshToken", newRefreshToken, option)
            .json(new ApiResponse(
                200,
                { accessToken, refreshToken: newRefreshToken },
                "Token refreshed"
            ))
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh Token")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(400, Invalid Old Password);
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    return res.status(200).json(
        new ApiResponse(200, {}, "Passowrd Changed Successfully");
    )
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(
            2000,
            req.user,
            "Current user fetched successfully"
        ))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { userName, fullName, email } = req.body;

    if (!userName || !fullName || !email) {
        throw new ApiError(401, "All Fields are required");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName,
                email: email,
                userName: userName
            }
        },
        { new: true }
    ).select("-passwrod");

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            user,
            "Account Detils Updated Successfully"
        ))
})

// Algo for update File
// 1. get file local path form user and check weather is available or not
// 2. upload url on cloudinary and check weather it is uploading or not
// 3. update in database 
const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    cosnt avatar = uploadOnCloudinary(avatarLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Error occured while uploading avatar ")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            user,
            "Avatar Updated Successfully....."
        ))
});


const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLoaclPath = req.file.path;
    if (!coverImageLoaclPath) {
        throw new ApiError(400, "Cover Image file is missing ");
    }
    const coverImage = await uploadOnCloudinary(coverImageLoaclPath);
    if (!coverImage) {
        throw new ApiError(400, "Error occured while uploading cover image on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { coverImage: coverImage.url }
        },
        { new: true }
    ).select("-password");

    return res
        .status(200)
        .json(new ApiResponse(
            200, 
            user, 
            "Cover image is updated successfully....."
        ))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}