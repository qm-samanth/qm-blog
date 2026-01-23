"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { PostStatus } from "@/types";

interface CreatePostInput {
  title: string;
  content: string;
  excerpt?: string;
  categoryId?: string;
}

interface UpdatePostInput {
  title?: string;
  content?: string;
  excerpt?: string;
  categoryId?: string;
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

    const newPost = await db.insert(posts).values({
      title: input.title,
      slug: slug,
      content: input.content,
      author_id: session.user.id,
      category_id: input.categoryId ? parseInt(input.categoryId) : null,
      status: "DRAFT",
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

    // Check authorization: Only owner or ADMIN can update
    if (
      session.user.role !== "ADMIN" &&
      post.authorId !== session.user.id
    ) {
      throw new Error("Unauthorized: You can only update your own posts");
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
          updatedAt: new Date(),
        })
        .where(eq(posts.id, postId))
        .returning();

      return updatedPost[0];
    }

    // Update post
    const updatedPost = await db
      .update(posts)
      .set({
        title: input.title,
        content: input.content,
        excerpt: input.excerpt,
        categoryId: input.categoryId,
        status: input.status,
        updatedAt: new Date(),
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
      post.authorId !== session.user.id
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
        publishedAt: new Date(),
        updatedAt: new Date(),
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

export async function submitForReview(postId: string) {
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
    if (post.authorId !== session.user.id && session.user.role !== "ADMIN") {
      throw new Error("Unauthorized: You can only submit your own posts");
    }

    const updatedPost = await db
      .update(posts)
      .set({
        status: "PENDING",
        updatedAt: new Date(),
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
