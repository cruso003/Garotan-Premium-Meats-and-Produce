import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import cloudinary from '../config/cloudinary';
import config from '../config/env';

// Configure multer for memory storage (files will be uploaded directly to Cloudinary)
const storage = multer.memoryStorage();

// File filter to accept only images
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
  }
};

// Create multer upload middleware
export const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxFileSize, // 10MB default
  },
  fileFilter,
});

/**
 * Upload an image buffer to Cloudinary
 * @param buffer - File buffer from multer
 * @param folder - Cloudinary folder path (e.g., 'products', 'users')
 * @param filename - Optional filename (without extension)
 * @returns Promise with upload result containing URL and public_id
 */
export const uploadToCloudinary = (
  buffer: Buffer,
  folder: string,
  filename?: string
): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `garotan/${folder}`,
        public_id: filename,
        resource_type: 'image',
        transformation: [
          { width: 1000, height: 1000, crop: 'limit', quality: 'auto' },
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        } else {
          reject(new Error('Upload failed'));
        }
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Delete an image from Cloudinary
 * @param publicId - The public ID of the image to delete
 * @returns Promise with deletion result
 */
export const deleteFromCloudinary = async (
  publicId: string
): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

/**
 * Upload multiple images to Cloudinary
 * @param files - Array of file buffers from multer
 * @param folder - Cloudinary folder path
 * @returns Promise with array of upload results
 */
export const uploadMultipleToCloudinary = async (
  files: Express.Multer.File[],
  folder: string
): Promise<Array<{ url: string; publicId: string }>> => {
  const uploadPromises = files.map((file) =>
    uploadToCloudinary(file.buffer, folder)
  );

  return Promise.all(uploadPromises);
};
