import { auth } from "@/auth";
import { db } from "@/db";
import { posts, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || (session.user.role !== "REVIEWER" && session.user.role !== "ADMIN")) {
      return new Response("Unauthorized", { status: 403 });
    }

    const pendingPosts = await db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        content: posts.content,
        authorEmail: users.email,
        createdAt: posts.created_at,
      })
      .from(posts)
      .leftJoin(users, eq(posts.author_id, users.id))
      .where(eq(posts.status, "PENDING"));

    return Response.json(pendingPosts);
  } catch (error) {
    console.error("Fetch pending posts error:", error);
    return Response.json(
      { error: "Failed to fetch pending posts" },
      { status: 500 }
    );
  }
}
