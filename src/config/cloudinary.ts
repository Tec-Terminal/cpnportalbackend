import cloudinary, { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// Upload to Cloudinary
export const uploadToCloudinary = (fileBuffer: Buffer): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      { resource_type: 'image' },
      (error: unknown, result: unknown) => {
        const uploadError = error as UploadApiErrorResponse | null;
        const uploadResult = result as UploadApiResponse | null;

        if (uploadError) {
          reject(uploadError);
        } else if (uploadResult) {
          resolve(uploadResult);
        } else {
          reject(new Error('Unknown error occurred during file upload.'));
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
};

export default cloudinary;
