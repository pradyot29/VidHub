import { Router } from "express";

import {
  loginUser,
  registerUser,
  logOutUser,
  refreshAccessToken,
} from "../controllers/user.controller.js"; // aise import tb hi le skte h jb export default na ho

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
//import { refreshAccessToken } from "../controllers/user.controller.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),

  registerUser
);

// route ka naam register hai (postman me yehi enter hoga)
//method ka naam registeruser hai
//router.route("/login").post(login)

router.route("/login").post(loginUser);

//secured routes
router.route("/logout").post(verifyJWT, logOutUser);
router.route("/refresh-token").post(refreshAccessToken);
export default router;
