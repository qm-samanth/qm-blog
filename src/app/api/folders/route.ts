import { auth } from "@/auth";
import { db } from "@/db";
import { folders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userFolders;
    if (session.user.role === "ADMIN") {
      // Admin can see all folders
      userFolders = await db.query.folders.findMany();
    } else {
      // User can see only their folders
      userFolders = await db.query.folders.findMany({
        where: eq(folders.user_id, session.user.id),
      });
    }

    return NextResponse.json(userFolders);
  } catch (error) {
    console.error("Error fetching folders:", error);
    return NextResponse.json({ error: "Failed to fetch folders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, user_id } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
    }

    // Determine which user to create the folder for
    const targetUserId = user_id || session.user.id;

    // Only allow creating folders for yourself unless you're admin
    if (session.user.role !== "ADMIN" && targetUserId !== session.user.id) {
      console.log("Unauthorized folder creation attempt:", {
        sessionUserId: session.user.id,
        targetUserId,
        userRole: session.user.role,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const folderId = uuidv4();
    const now = new Date();

    console.log("Creating folder:", { folderId, targetUserId, name });

    const newFolder = await db.insert(folders).values({
      id: folderId,
      user_id: targetUserId,
      name: name.trim(),
      created_at: now,
      updated_at: now,
    }).returning();

    console.log("Folder created successfully:", newFolder[0]);
    return NextResponse.json(newFolder[0]);
  } catch (error) {
    console.error("Error creating folder:", error);
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
  }
}
