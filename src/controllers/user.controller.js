import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";  // validations
import { User } from "../models/user.model.js"; // checking user already exist
import { uploadOnCloudinary } from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens =async(userId) => {
try{
 const user = await User.findById(userId)
 const accessToken = user.generateAccessToken()
 const refreshToken = user.generateRefreshToken()

 // access token user ko dedete hai but refresh token db me bhi store krke rkhte hai
 // how to store refresh token in db
 user.refreshToken = refreshToken
 await user.save({validateBeforeSave: false})

 return { accessToken , refreshToken}
}
catch(error){
throw new ApiError(500, "Something went wrong while generating refresh and access token")
}
}
// registering user 

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend / postman

  const {fullName, email, userName , password} = req.body   // form se yaa json se data jb aaye to isme miljaega, url se aaye to different approach h

  console.log("email :"   , email );
    


     // validation check
    if(fullName === "")
    {
    throw new ApiError(400, "full name is required")
    }
    if(email === "")
    {
    throw new ApiError(400, "email is required")
    }
    if(userName === "")
    {
    throw new ApiError(400, "username  is required")
    }
    if(password === "")
    {
     throw new ApiError(400, "password is required")
    }
    
    const existedUser = await User.findOne({
        $or: [{userName}, {email}] // returns 1st document with same username or email
    })

    if(existedUser)
        {
        throw new ApiError(409 ,"User with email/userName already exist")
        }
    //console.log(req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath =  req.files?.coverImage[0]?.path  // multer ko bolre hai return krne ko
    let coverImageLocalPath;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0){
    coverImageLocalPath = req.files.coverImage[0].path
    }
    if(!avatarLocalPath)
        {
        throw new ApiError(400, "Avatar file is required")
        }

    
    // upload on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage =  await uploadOnCloudinary(coverImageLocalPath)
    if(!avatar)
        {
        throw new ApiError(400, "Avatar file is required")
        }
    
    // create user entry in db
    const user = await User.create(
    {
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    userName: userName.toLowerCase()
    }
    )
    const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"    // minus sign lagake likha hai kuiki ye nhi chaiye , default saare selected hote h
    ) // best way to check ki db me user bana ki nhi

    if(!createdUser)
        {
        throw new ApiError(500 , "Something went wrong while registering the user")
        }

    // returning response

    return res.status(201).json(
    new ApiResponse(200, createdUser, "User Registered Successfully")
    )
})


// login user

const loginUser = asyncHandler(async(req,res) => {
 //steps
 //1. req.body se data le aao
 //2. username or email
 //3. find user
 //4. passwd check
 //5. generate access and refresh token
 //6. send token as cookie


 const {email,userName,password} = req.body
 //console.log(userName)

 if(!userName && !email )
    {
    throw new ApiError(400, "username or email is required")
    }
    const user = await User.findOne({
    $or: [{userName},  {email}]
    })
  if(!user){
  throw new ApiError(404, "User does not exist")
  }

  const isPasswordValid = await user.isPasswordCorrect(password)

  if(!isPasswordValid){
    throw new ApiError(401, "Invalid User credentials")
    }

  const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options = {
  httpOnly: true,
  secure: true
  }
  //console.log(accessToken);
  return res
  .status(200)
  .cookie("accessToken", accessToken , options)
  .cookie("refreshToken"  , refreshToken, options)
  .json(
    new ApiResponse( 200, {user: loggedInUser, accessToken, refreshToken}, "User logged in successfully")

  )
})


// logout user

const logOutUser = asyncHandler(async(req,res) => {
    console.log(req.user)
  await User.findByIdAndUpdate( req.user._id, 
 {
  $unset: {
   refreshToken: 1 //this removes field from document
  }
},
  {
   new : true
  }
 )
  
 const options = {
    httpOnly: true,
    secure: true
    }
    console.log("hello")
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200,{}, "User logged out"));
   
})

const refreshAccessToken = asyncHandler(async(req,res) => {
const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

if(!incomingRefreshToken){
throw new ApiError(401,"unauthorized request")
}
try {
    const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    )
    const user = await User.findById(decodedToken?._id)
    if(!user){
    throw new ApiError(401,"invalid refresh token ")
    }
    
    if(incomingRefreshToken !== user?.refreshToken){
    throw new ApiError(401 , "Refresh Token is expired or used")
    }
    
    const options = {
        httpOnly: true,
        secure: true
    }
    const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
    return res
    .status(200)
    .cookie("accessToken", accessToken , options)
    .cookie("refreshToken" , newRefreshToken, options)
    .json(
        new ApiResponse(
            200, {accessToken , refreshToken: newRefreshToken}, "Access token refreshed"
        )
    )
} catch (error) {
  throw new ApiError(401, error?.message || "Invalid refresh token")  
}
})


const changeCurrentPassword = asyncHandler(async(req,res) => {
const {oldPassword, newPassword} = req.body
const user = await User.findById(req.user?._id)
const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
if(!isPasswordCorrect){
throw new ApiError(400, "Invalid old password")
}

user.password = newPassword
await user.save({validateBeforeSave:false})
return res
.status(200)
.json(new ApiResponse(200, {} , "Password Changed Successfully"))
})

const getCurrentUser = asyncHandler(async(req,res) =>{
return res
.status(200)
.json(200, req.user, "current user fetched successfully")
});

const updateAccountDetails  = asyncHandler(async(req,res)=>{
const{fullName,email}= req.body

if(!(fullName || email))
    {
        throw new ApiError(400,"All fields required")
    }
    const user = User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
            fullName, email: email
            }
        }, 
        {new:true}

    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user,"Account details updated successfully"))
});

const updateUserAvatar = asyncHandler(async(req,res) => {
const avatarLocalPath = req.file?.path
if(!avatarLocalPath){
throw new ApiError(400,"Avatar file is missing")
}
const avatar = await uploadOnCloudinary(avatarLocalPath)

if(!avatar.url)
    {
        throw new ApiError(400,"Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
            avatar: avatar.url
            }
        },
        {new:true}
     ).select("-password")

     return res
         .status(200)
         .json(
            new ApiResponse(200, user, "Avatar is updated successfully")
         )
})

const updateUserCoverImage = asyncHandler(async(req,res) => {
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath){
    throw new ApiError(400,"Cover image file is missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    if(!coverImage.url)
        {
            throw new ApiError(400,"Error while uploading cover image")
        }
    
         const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                coverImage : coverImage.url
                }
            },
            {new:true}
         ).select("-password")

         return res
         .status(200)
         .json(
            new ApiResponse(200, user, "Cover Image is updated successfully")
         )
    })
export {registerUser, loginUser, logOutUser , refreshAccessToken, changeCurrentPassword
    , getCurrentUser , updateAccountDetails, updateUserAvatar , updateUserCoverImage}
