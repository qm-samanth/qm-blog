import { auth } from "@/auth";
import { db } from "@/db";
import { images } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const folderId = request.nextUrl.searchParams.get("folderId");

    let userImages;
    if (session.user.role === "ADMIN") {
      // Admin can see all images
      if (folderId) {
        userImages = await db.query.images.findMany({
          where: eq(images.folder_id, folderId),
        });
      } else {
        userImages = await db.query.images.findMany();
      }
    } else {
      // User can see only their images
      if (folderId) {
        userImages = await db.query.images.findMany({
          where: and(eq(images.folder_id, folderId), eq(images.user_id, session.user.id)),
        });
      } else {
        userImages = await db.query.images.findMany({
          where: eq(images.user_id, session.user.id),
        });
      }
    }

    return NextResponse.json(userImages);
  } catch (error) {
    console.error("Error fetching images:", error);
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const fileName = formData.get("filename") as string;
    const cloudinaryPublicId = formData.get("cloudinary_public_id") as string;
    const cloudinaryUrl = formData.get("cloudinary_url") as string;
    const fileSize = formData.get("file_size") ? parseInt(formData.get("file_size") as string) : null;
    const folderId = formData.get("folder_id") as string | null;
    const userId = formData.get("user_id") as string;

    if (!fileName || !cloudinaryPublicId || !cloudinaryUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Determine which user to upload for
    const targetUserId = userId || session.user.id;

    // Only allow uploading for yourself unless you're admin
    if (session.user.role !== "ADMIN" && targetUserId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const imageId = uuidv4();
    const now = new Date();

    const newImage = await db.insert(images).values({
      id: imageId,
      user_id: targetUserId,
      folder_id: folderId || null,
      cloudinary_public_id: cloudinaryPublicId,
      cloudinary_url: cloudinaryUrl,
      filename: fileName,
      file_size: fileSize,
      created_at: now,
    }).returning();

    return NextResponse.json(newImage[0]);
  } catch (error) {
    console.error("Error creating image record:", error);
    return NextResponse.json({ error: "Failed to create image record" }, { status: 500 });
  }
}
