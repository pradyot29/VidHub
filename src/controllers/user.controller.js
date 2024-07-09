import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";  // validations
import { User } from "../models/user.model.js"; // checking user already exist
import { uploadOnCloudinary } from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/Apiresponse.js";

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

 if(!userName || !email)
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

  return res
  .status(200)
  .cookie("accessToken", accessToken , options)
  .cookie("refreshToken" , refreshToken , refreshToken, options)
  .json(
    new ApiResponse( 200, {user: loggedInUser, accessToken, refreshToken}, "User logged in successfully")

  )
})


// logout user

const logOutUser = asyncHandler(async(req,res) => {
  await User.findByIdAndUpdate( req.user._id, 
 {
  $set: {
   refreshToken: undefined
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

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200,{}, "User logged out"))
})


export {registerUser, loginUser, logOutUser }