import { asyncHandler } from "../utils/asyncHandler.js";


// registering user 

const registerUser = asyncHandler(async (req, res) => {
  res.status(200).json({
message: "its vibhu"
})
})

export {registerUser, 

}