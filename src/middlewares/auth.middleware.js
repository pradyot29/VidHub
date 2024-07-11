import { ApiError } from "../utils/ApiError.js";
//import { asyncHandler } from "../utils/asyncHandler";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
//import { User } from "../models/user.model";
import { User } from "../models/user.model.js";
export const verifyJWT = asyncHandler(async(req, _, next) => {
try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", "")
    //console.log("token is" , token )
    if(!token){
    throw new ApiError(401, "Unauthorized request")
    
    }
    //console.log("Received Token:",process.env.ACCESS_TOKEN_SECRET );
    const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    //console.log("Decoded Token:", decodedToken);
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
    if(!user){
    
    throw new ApiError(401, "Invalid Access Token")
    }
    
    req.user = user;
    next();
} catch (error) {
throw new ApiError(401, error?.message || "Invalid access token") 
}
}); 
