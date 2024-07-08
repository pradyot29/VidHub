import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"; // file system h, file ko read/write/remove/permissionchange/manage krta h
 // Configuration
 cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async ( localFilePath)=> {
    try{
if(!localFilePath)
    return null

//upload file on cloudinary
const response = await cloudinary.uploader.upload(localFilePath , {
    resource_type:"auto" // khud detect krlo jo bhi file aari h
})
//file has been uploaded successfully
//console.log("file is uploaded on cloudinary" , response.url)
fs.unlinkSync(localFilePath)
return response; 
    }
    catch{
fs.unlinkSync(localFilePath) // remove the locally saved temporary files as the upload got failed
return null;
    }
}

export {uploadOnCloudinary}