import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'
import path from 'path'

cloudinary.config({ 
  cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
  api_key:process.env.CLOUDINARY_CLOUD_APIKey, 
  api_secret:process.env.CLOUDINARY_CLOUD_APISecret
});

const uploadOnCloudinary=async(file:Blob): Promise<string | null>=>{
if(!file)
{
    return "/icon.png"
}

try{
const arrayBuffer=await file.arrayBuffer()
const buffer=Buffer.from(arrayBuffer)

const saveLocally = () => {
    try {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        let extension = 'png';
        const fileObj = file as File;
        if (fileObj.name) {
            const ext = path.extname(fileObj.name);
            if (ext) extension = ext.replace('.', '');
        } else if (file.type) {
            const parts = file.type.split('/');
            if (parts.length > 1) extension = parts[1];
        }
        
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${extension}`;
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, buffer);
        
        console.log("Cloudinary fallback: Saved image locally at", filePath);
        return `/uploads/${fileName}`;
    } catch (localError) {
        console.error("Local file save fallback failed:", localError);
        return "/icon.png";
    }
};

const url = await new Promise<string | null>((resolve)=>{
    const uploadStream=cloudinary.uploader.upload_stream(
    {
        resource_type:"auto"
    },(error,result)=>{
        if(error){
            console.error("Cloudinary upload error:", error)
            resolve(null)  
        }
        else{
            resolve(result?.secure_url ?? null)
        }
    })
    uploadStream.end(buffer)
})
return url || saveLocally()
}catch(error){
    console.error("Cloudinary try-catch error:", error)
    return "/icon.png"
}

}
export default uploadOnCloudinary