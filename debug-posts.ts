import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";

async function debugPosts() {
  try {
    console.log("Fetching all posts from database...");
    
    // Get all posts
    const allPosts = await db.query.posts.findMany();
    console.log("Total posts:", allPosts.length);
    console.log("\nAll posts:");
    allPosts.forEach(post => {
      console.log(`
ID: ${post.id}
Title: ${post.title}
Slug: ${post.slug}
Status: ${post.status}
---`);
    });

    // Try to find by UUID
    const testUUID = "6fc8b0e1-581d-462f-9f8c-299b3a63e019";
    console.log(`\nSearching for post with ID: ${testUUID}`);
    const postById = await db.query.posts.findFirst({
      where: eq(posts.id, testUUID),
    });
    console.log("Found by ID:", postById);

  } catch (err) {
    console.error("Error:", err);
  }
}

debugPosts();
