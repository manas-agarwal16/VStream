import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOncloudinary = async (localFilePath) => {
  try {
    const upload = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto", //auto detects itself , either video , image, file ...
    });
    console.log(`file is uploaded successfully on cloudinary: ${upload?.url}`); //Cloudinary generates a URL where the uploaded file can be accessed and we save this url into our database.
    fs.unlinkSync(localFilePath); //u can uncomment this while testing.
    return upload; // contain fields like format, width, height, url,etc.
  } catch (error) {
    console.log("error in uploading file to cloudinary: ", error);
    if (!localFilePath) {
      fs.unlinkSync(localFilePath);
    } //remove the locally saved file in the server Synchronously means its important verna currupted and unwanted files be mtlb me save rahengi server pe.
    return null;
  }
};

const deleteFileFromCloudinary = async (public_id) => {
  try {
    const result = await cloudinary.uploader.destroy(public_id);
    console.log("deletion of cloudinay information: ", result);
    return result;
  } catch (error) {
    console.log("error in deleting file from cloudinary");
    throw error;
  }
};

export { uploadOncloudinary , deleteFileFromCloudinary};
