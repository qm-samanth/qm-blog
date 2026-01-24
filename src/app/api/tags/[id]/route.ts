import { auth } from "@/auth";
import { db } from "@/db";
import { tags } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    // Check if user is admin
    if (!session?.user || session.user.role !== "ADMIN") {
      return Response.json({ error: "Unauthorized - Admin only" }, { status: 403 });
    }

    const { id } = await params;
    const tagId = parseInt(id);

    // Delete tag
    const deletedTag = await db
      .delete(tags)
      .where(eq(tags.id, tagId))
      .returning();

    if (deletedTag.length === 0) {
      return Response.json({ error: "Tag not found" }, { status: 404 });
    }

    return Response.json({ message: "Tag deleted successfully" });
  } catch (error) {
    console.error("Error deleting tag:", error);
    return Response.json({ error: "Failed to delete tag" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    // Check if user is admin
    if (!session?.user || session.user.role !== "ADMIN") {
      return Response.json({ error: "Unauthorized - Admin only" }, { status: 403 });
    }

    const { id } = await params;
    const tagId = parseInt(id);
    const { name } = await req.json();

    if (!name || name.trim() === "") {
      return Response.json({ error: "Tag name is required" }, { status: 400 });
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");

    // Update tag
    const updatedTag = await db
      .update(tags)
      .set({
        name: name.trim(),
        slug,
        updated_at: new Date(),
      })
      .where(eq(tags.id, tagId))
      .returning();

    if (updatedTag.length === 0) {
      return Response.json({ error: "Tag not found" }, { status: 404 });
    }

    return Response.json(updatedTag[0]);
  } catch (error) {
    console.error("Error updating tag:", error);
    return Response.json({ error: "Failed to update tag" }, { status: 500 });
  }
}
