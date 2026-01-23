"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { posts, users, categories } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import type { PostStatus } from "@/types";

interface CreatePostInput {
  title: string;
  content: string;
  categoryId?: number;
}

export interface CategoryDTO {
  id: number;
  name: string;
  slug: string;
}

export async function getCategories(): Promise<CategoryDTO[]> {
  try {
    const result = await db.select().from(categories);
    return result as CategoryDTO[];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function getReviewers() {
  try {
    const result = await db.query.users.findMany({
      where: eq(users.role, "REVIEWER"),
    });
    return result.map((r) => ({ id: r.id, email: r.email }));
  } catch (error) {
    console.error("Error fetching reviewers:", error);
    return [];
  }
}

interface UpdatePostInput {
  title?: string;
  content?: string;
  categoryId?: number;
  status?: PostStatus;
}

export async function createPost(input: CreatePostInput) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized: Must be logged in to create a post");
  }

  if (session.user.role !== "USER" && session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Only users and admins can create posts");
  }

  try {
    // Generate slug from title
    const slug = input.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    const now = new Date();
    const newPost = await db.insert(posts).values({
      id: uuidv4(),
      title: input.title,
      slug: slug,
      content: input.content,
      author_id: session.user.id,
      category_id: input.categoryId || null,
      status: "DRAFT",
      created_at: now,
      updated_at: now,
    }).returning();

    return newPost[0];
  } catch (error) {
    console.error("Error creating post:", error);
    throw new Error("Failed to create post");
  }
}

export async function updatePost(postId: string, input: UpdatePostInput) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized: Must be logged in to update a post");
  }

  try {
    // Fetch the post to check ownership
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
    });

    if (!post) {
      throw new Error("Post not found");
    }

    // REVIEWER can only update status
    if (session.user.role === "REVIEWER") {
      if (!input.status) {
        throw new Error("Reviewers can only update post status");
      }

      const updatedPost = await db
        .update(posts)
        .set({
          status: input.status,
          updated_at: new Date(),
        })
        .where(eq(posts.id, postId))
        .returning();

      return updatedPost[0];
    }

    // Check authorization: Only owner or ADMIN can edit content
    if (
      session.user.role !== "ADMIN" &&
      post.author_id !== session.user.id
    ) {
      throw new Error("Unauthorized: You can only update your own posts");
    }

    // Update post
    const updatedPost = await db
      .update(posts)
      .set({
        ...(input.title && { title: input.title }),
        ...(input.content && { content: input.content }),
        ...(input.categoryId !== undefined && { category_id: input.categoryId }),
        // If editing a published post, revert to DRAFT for review
        ...(post.status === "PUBLISHED" && !input.status && { status: "DRAFT" }),
        ...(input.status && { status: input.status }),
        updated_at: new Date(),
      })
      .where(eq(posts.id, postId))
      .returning();

    return updatedPost[0];
  } catch (error) {
    console.error("Error updating post:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to update post");
  }
}

export async function deletePost(postId: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized: Must be logged in to delete a post");
  }

  try {
    // Fetch the post to check ownership
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
    });

    if (!post) {
      throw new Error("Post not found");
    }

    // Check authorization: Only owner or ADMIN can delete
    if (
      session.user.role !== "ADMIN" &&
      post.author_id !== session.user.id
    ) {
      throw new Error("Unauthorized: You can only delete your own posts");
    }

    // Delete post
    await db.delete(posts).where(eq(posts.id, postId));

    return { success: true };
  } catch (error) {
    console.error("Error deleting post:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to delete post");
  }
}

export async function publishPost(postId: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized: Must be logged in");
  }

  if (session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Only admins can publish posts");
  }

  try {
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
    });

    if (!post) {
      throw new Error("Post not found");
    }

    const updatedPost = await db
      .update(posts)
      .set({
        status: "PUBLISHED",
        updated_at: new Date(),
      })
      .where(eq(posts.id, postId))
      .returning();

    return updatedPost[0];
  } catch (error) {
    console.error("Error publishing post:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to publish post");
  }
}

export async function submitForReview(postId: string, reviewerId?: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized: Must be logged in");
  }

  try {
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
    });

    if (!post) {
      throw new Error("Post not found");
    }

    // Check ownership
    if (post.author_id !== session.user.id && session.user.role !== "ADMIN") {
      throw new Error("Unauthorized: You can only submit your own posts");
    }

    // Verify reviewer exists if provided
    let finalReviewerId = reviewerId;
    if (reviewerId) {
      const reviewer = await db.query.users.findFirst({
        where: eq(users.id, reviewerId),
      });
      if (!reviewer || reviewer.role !== "REVIEWER") {
        throw new Error("Invalid reviewer selected");
      }
      finalReviewerId = reviewer.id;
    }

    const updatedPost = await db
      .update(posts)
      .set({
        status: "PENDING",
        ...(finalReviewerId && { reviewer_id: finalReviewerId }),
        updated_at: new Date(),
      })
      .where(eq(posts.id, postId))
      .returning();

    return updatedPost[0];
  } catch (error) {
    console.error("Error submitting post for review:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to submit post for review");
  }
}
