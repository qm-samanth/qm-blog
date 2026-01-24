import { auth } from "@/auth";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

interface ReviewRequest {
  postId: string;
  action: "approve" | "reject";
  comments: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a reviewer or admin
    if (session.user.role !== "REVIEWER" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only reviewers can review posts" },
        { status: 403 }
      );
    }

    const { postId, action, comments } = (await req.json()) as ReviewRequest;

    if (!postId || !action || !comments) {
      return NextResponse.json(
        { error: "Missing required fields: postId, action, comments" },
        { status: 400 }
      );
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Get the post
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending posts can be reviewed" },
        { status: 400 }
      );
    }

    // Update post with review decision and comments
    const updatedPost = await db
      .update(posts)
      .set({
        status: action === "approve" ? "PUBLISHED" : "REJECTED",
        reviewer_id: session.user.id,
        reviewer_comments: comments,
        updated_at: new Date(),
      })
      .where(eq(posts.id, postId))
      .returning();

    return NextResponse.json({
      success: true,
      message: `Post ${action}ed successfully`,
      post: updatedPost[0],
    });
  } catch (error) {
    console.error("Error reviewing post:", error);
    return NextResponse.json(
      { error: "Failed to review post" },
      { status: 500 }
    );
  }
}
