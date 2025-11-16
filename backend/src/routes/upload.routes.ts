import { Router } from 'express';
import { upload } from '../utils/upload';
import {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
} from '../controllers/upload.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

// All upload routes require authentication
router.use(authenticate());

/**
 * @route   POST /api/upload/image
 * @desc    Upload a single image
 * @access  Private
 */
router.post('/image', upload.single('image'), uploadImage);

/**
 * @route   POST /api/upload/images
 * @desc    Upload multiple images
 * @access  Private
 */
router.post('/images', upload.array('images', 10), uploadMultipleImages);

/**
 * @route   DELETE /api/upload/image
 * @desc    Delete an image from Cloudinary
 * @access  Private
 */
router.delete('/image', deleteImage);

export default router;
