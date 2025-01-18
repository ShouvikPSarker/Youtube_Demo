import {v2 as cloudinary} from 'cloudinary';
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key:  process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadfile = async (filepath) =>{
    try {
        if(!filepath) return null;
        const response = await cloudinary.uploader.upload(filepath , {
            resource_type: "auto",
        })
        console.log("File has been uploaded successfully!",response.url)
        // fs.unlinkSync(filepath)
        return response
    } catch (error) {
        fs.unlinkSync(filepath)
        console.log("Error uploading file",error)
    }
}


export default uploadfile;