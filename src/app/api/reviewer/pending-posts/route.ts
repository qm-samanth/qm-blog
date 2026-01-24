import { auth } from "@/auth";
import { db } from "@/db";
import { posts, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a reviewer or admin
    if (session.user.role !== "REVIEWER" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only reviewers can access pending posts" },
        { status: 403 }
      );
    }

    // Get pending posts
    const pendingPosts = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        content: posts.content,
        status: posts.status,
        author_id: posts.author_id,
        reviewer_id: posts.reviewer_id,
        reviewer_comments: posts.reviewer_comments,
        featured_image_url: posts.featured_image_url,
        created_at: posts.created_at,
        updated_at: posts.updated_at,
        author: {
          id: users.id,
          email: users.email,
        },
      })
      .from(posts)
      .leftJoin(users, eq(posts.author_id, users.id))
      .where(eq(posts.status, "PENDING"));

    return NextResponse.json(pendingPosts);
  } catch (error) {
    console.error("Error fetching pending posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending posts" },
      { status: 500 }
    );
  }
}
