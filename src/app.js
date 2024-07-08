import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser"; // iska kaam itna h ki mein mere server se user k browser ki cookies access kr paau or set kr paau , bascially uske cookies pe CRUD operations

const app = express()
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))
app.use(express.json({limit: "16kb"})) // server me traffic manage krne k liye
app.use(express.urlencoded({extended : true ,  limit: "16kb"})) 
// extended ka mtlb objects k andar bhi objects de skte ho
// url encoded statement isliye use hui h ki jb url se data aaye to use kse handle kre 

app.use(express.static("public"))
app.use(cookieParser())


//importing routes

import userRouter from './routes/user.routes.js' // aisa import jb hi de skte hai jb export default hora ho

//route declaration
app.use("/api/v1/users",userRouter)  // /users hote hi control pass hojaega user.routes pe
                            //   /users k baad jitne bhi method likhe jaenge vo saare user.routes me likhe jaenge   

// http://localhost:8000/api/v1/users/login    
export {app} 