// Filename: actions/cloudinary.actions.ts
'use server';

import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with your credentials from .env.local
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const getSignature = async () => {
  const timestamp = Math.round(new Date().getTime() / 1000);

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp: timestamp,
      folder: 'meet-pro-recordings', // Optional: organize recordings in a folder
    },
    process.env.CLOUDINARY_API_SECRET!
  );

  return { timestamp, signature };
};