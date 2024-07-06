import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser"; // iska kaam itna h ki mein mere server se user k browser ki cookies access kr paau or set kr paau , bascially uske cookies pe CRUD operations

const app = express()
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))
app.use(express.json({limit: "16kb"})) // server me traffic manage krne k liye
app.use(express.urlencoded({extended : true  limit: "16kb"})) // extended ka mtlb objects k andar bhi objects de skte ho
// url encoded statement isliye use hui h ki jb url se data aaye to use kse handle kre 

app.use(express.static("public"))
app.use(cookieParser())
export { app } 