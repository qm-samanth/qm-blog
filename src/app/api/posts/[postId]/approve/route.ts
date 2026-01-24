import { auth } from "@/auth";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await auth();
    const { postId } = await params;

    if (!session?.user || (session.user.role !== "REVIEWER" && session.user.role !== "ADMIN")) {
      return new Response("Unauthorized", { status: 403 });
    }

    const { comments } = await request.json();

    await db
      .update(posts)
      .set({
        status: "PUBLISHED",
        reviewer_id: session.user.id,
        reviewer_comments: comments || null,
      })
      .where(eq(posts.id, postId));

    return Response.json({ success: true });
  } catch (error) {
    console.error("Approve error:", error);
    return Response.json(
      { error: "Failed to approve post" },
      { status: 500 }
    );
  }
}
