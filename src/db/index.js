import mongoose from "mongoose";
import {DB_NAME} from "../constants.js";
const connectDB = async() => {
try{
 const connectionInstance = await mongoose.connect
 (`${process.env.MONGODB_URI}/${DB_NAME}`) // spacing ka dhyan rkhna hai 
console.log(`\n MongoDB connected !! DB Host : ${connectionInstance.connection.host}`);
//console.log(`${process.env.MONGODB_URI}/${DB_NAME}`);
}
catch (error){
console.log("MONGODB Connection error", error);
process.exit(1);
}
}

export default connectDB