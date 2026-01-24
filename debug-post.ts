import { db } from "@/db";
import { posts, users } from "@/db/schema";
import { eq } from "drizzle-orm";

async function debugPost() {
  try {
    // Query the post
    const post = await db.query.posts.findFirst({
      where: eq(posts.slug, "node-documentation"),
    });

    console.log("Post found:", post);
    console.log("Post author_id:", post?.author_id);
    console.log("Post status:", post?.status);
    console.log("Post slug:", post?.slug);

    if (post?.author_id) {
      const author = await db.query.users.findFirst({
        where: eq(users.id, post.author_id),
      });
      console.log("Author:", author);
    }

    // List all posts
    console.log("\n\nAll posts:");
    const allPosts = await db.query.posts.findMany();
    allPosts.forEach((p: any) => {
      console.log(`- ${p.title} (slug: ${p.slug}, author_id: ${p.author_id}, status: ${p.status})`);
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

debugPost();
