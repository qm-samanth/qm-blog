import { auth } from "@/auth";
import { db } from "@/db";
import { folders, images } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get the folder
    const folder = await db.query.folders.findFirst({
      where: eq(folders.id, id),
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Check permissions
    if (session.user.role !== "ADMIN" && folder.user_id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all images in this folder
    const folderImages = await db.query.images.findMany({
      where: eq(images.folder_id, id),
    });

    // Delete each image from Cloudinary
    for (const image of folderImages) {
      try {
        await cloudinary.uploader.destroy(image.cloudinary_public_id);
      } catch (error) {
        console.error(`Error deleting image ${image.id} from Cloudinary:`, error);
        // Continue with next image even if one fails
      }
    }

    // Delete the folder (this will also delete images records due to cascade)
    await db.delete(folders).where(eq(folders.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting folder:", error);
    return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 });
  }
}

