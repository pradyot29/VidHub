import { Router } from "express";

import {registerUser} from "../controllers/user.controller.js"; // aise import tb hi le skte h jb export default na ho
const router = Router()


router.route("/register").post(registerUser) // route ka naam register hai (postman me yehi enter hoga)
//method ka naam registeruser hai
//router.route("/login").post(login)
export default router  