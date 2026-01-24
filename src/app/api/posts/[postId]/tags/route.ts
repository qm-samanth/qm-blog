import { auth } from "@/auth";
import { db } from "@/db";
import { postTags, tags } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    // Get all tags for the post
    const postTagList = await db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
      })
      .from(postTags)
      .leftJoin(tags, eq(postTags.tag_id, tags.id))
      .where(eq(postTags.post_id, postId));

    return Response.json(postTagList);
  } catch (error) {
    console.error("Error fetching post tags:", error);
    return Response.json({ error: "Failed to fetch post tags" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { postId } = await params;
    const { tagIds } = await req.json();

    if (!Array.isArray(tagIds)) {
      return Response.json({ error: "tagIds must be an array" }, { status: 400 });
    }

    // Delete existing post tags
    await db.delete(postTags).where(eq(postTags.post_id, postId));

    // Add new tags
    if (tagIds.length > 0) {
      const newPostTags = tagIds.map((tagId) => ({
        post_id: postId,
        tag_id: tagId,
      }));

      await db.insert(postTags).values(newPostTags);
    }

    return Response.json({ message: "Post tags updated successfully" });
  } catch (error) {
    console.error("Error updating post tags:", error);
    return Response.json({ error: "Failed to update post tags" }, { status: 500 });
  }
}
