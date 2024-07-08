import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";  // validations
import { User } from "../models/user.model.js"; // checking user already exist
import { uploadOnCloudinary } from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/Apiresponse.js";
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

export {registerUser, }