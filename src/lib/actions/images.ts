"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { images } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadImageInput {
  base64: string;
  filename: string;
  fileSize: number;
}

export async function uploadImage(input: UploadImageInput) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized: Must be logged in to upload images");
  }

  try {
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(input.base64, {
      folder: "qm-blog",
      public_id: `${Date.now()}-${uuidv4()}`,
      resource_type: "auto",
    });

    // Store in database
    const imageRecord = await db
      .insert(images)
      .values({
        id: uuidv4(),
        user_id: session.user.id,
        cloudinary_public_id: result.public_id,
        cloudinary_url: result.secure_url,
        filename: input.filename,
        file_size: input.fileSize,
        created_at: new Date(),
      })
      .returning();

    return {
      id: imageRecord[0].id,
      url: imageRecord[0].cloudinary_url,
      publicId: imageRecord[0].cloudinary_public_id,
    };
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to upload image");
  }
}

export async function deleteImage(imageId: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized: Must be logged in to delete images");
  }

  // Only ADMIN can delete images
  if (session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Only admins can delete images");
  }

  try {
    const image = await db.query.images.findFirst({
      where: eq(images.id, imageId),
    });

    if (!image) {
      throw new Error("Image not found");
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(image.cloudinary_public_id);

    // Delete from database
    await db.delete(images).where(eq(images.id, imageId));

    return { success: true };
  } catch (error) {
    console.error("Error deleting image:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to delete image");
  }
}

export async function getImages(limit = 50, offset = 0) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized: Must be logged in");
  }

  // Admins see all images, users see only their own
  try {
    if (session.user.role === "ADMIN") {
      const allImages = await db.query.images.findMany({
        limit,
        offset,
        orderBy: (images, { desc }) => [desc(images.created_at)],
      });
      return allImages;
    } else {
      const userImages = await db.query.images.findMany({
        where: eq(images.user_id, session.user.id),
        limit,
        offset,
        orderBy: (images, { desc }) => [desc(images.created_at)],
      });
      return userImages;
    }
  } catch (error) {
    console.error("Error fetching images:", error);
    throw new Error("Failed to fetch images");
  }
}
