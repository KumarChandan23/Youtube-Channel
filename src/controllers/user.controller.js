import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res)=>{
    res.status(200).json({message:"okay, you are connected to db and getting data"})
} );

export {registerUser}