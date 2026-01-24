import { auth } from "@/auth";
import { db } from "@/db";
import { tags } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const allTags = await db.select().from(tags).orderBy(tags.name);
    return Response.json(allTags);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return Response.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    // Check if user is admin
    if (!session?.user || session.user.role !== "ADMIN") {
      return Response.json({ error: "Unauthorized - Admin only" }, { status: 403 });
    }

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

    // Check if tag already exists
    const existingTag = await db
      .select()
      .from(tags)
      .where(eq(tags.slug, slug))
      .limit(1);

    if (existingTag.length > 0) {
      return Response.json({ error: "Tag already exists" }, { status: 400 });
    }

    // Create tag
    const newTag = await db
      .insert(tags)
      .values({
        name: name.trim(),
        slug,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();

    return Response.json(newTag[0], { status: 201 });
  } catch (error) {
    console.error("Error creating tag:", error);
    return Response.json({ error: "Failed to create tag" }, { status: 500 });
  }
}
