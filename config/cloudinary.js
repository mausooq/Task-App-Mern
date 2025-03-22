const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const deleteImage = async (imageUrl) => {
    try {
        console.log(imageUrl)
        const publicId = imageUrl.split('/').pop().split('.')[0];  
        await cloudinary.uploader.destroy(`task-images/${publicId}`);
        console.log(`Deleted image: ${publicId}`);
    } catch (error) {
        console.error("Error deleting image from Cloudinary:", error);
    }
};


const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'task-images',
        allowed_formats: ['jpg', 'png', 'jpeg'],
        transformation: [{ width: 500, height: 500, crop: "limit" }]
    }
});

const upload = multer({ storage });

module.exports = { cloudinary, upload , deleteImage };
