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

    if (!comments || comments.trim() === "") {
      return Response.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    await db
      .update(posts)
      .set({
        status: "REJECTED",
        reviewer_id: session.user.id,
        reviewer_comments: comments,
      })
      .where(eq(posts.id, postId));

    return Response.json({ success: true });
  } catch (error) {
    console.error("Reject error:", error);
    return Response.json(
      { error: "Failed to reject post" },
      { status: 500 }
    );
  }
}
