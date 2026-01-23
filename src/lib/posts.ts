"use server";

import { db } from "@/db";
import { posts, users } from "@/db/schema";
import { eq, and, or, desc } from "drizzle-orm";
import type { Post, UserRole } from "@/types";

/**
 * Fetch posts based on user role with RBAC logic
 * - ADMIN: All posts
 * - REVIEWER: All posts (for review queue)
 * - USER: Only their own posts + published posts from others
 * - GUEST: Only published posts
 */
export async function getPostsByRole(
  userRole: UserRole,
  userId?: string,
  limit: number = 10,
  offset: number = 0
): Promise<Post[]> {
  try {
    if (userRole === "ADMIN" || userRole === "REVIEWER") {
      // ADMIN and REVIEWER see all posts
      const result = await db.query.posts.findMany({
        orderBy: [desc(posts.created_at)],
        limit,
        offset,
      });
      return result as Post[];
    }

    if (userRole === "USER" && userId) {
      // USER sees their own posts + all published posts
      const result = await db.query.posts.findMany({
        where: or(
          eq(posts.author_id, userId),
          eq(posts.status, "PUBLISHED")
        ),
        orderBy: [desc(posts.created_at)],
        limit,
        offset,
      });
      return result as Post[];
    }

    // GUEST sees only published posts
    const result = await db.query.posts.findMany({
      where: eq(posts.status, "PUBLISHED"),
      orderBy: [desc(posts.created_at)],
      limit,
      offset,
    });
    return result as Post[];
  } catch (error) {
    console.error("Error fetching posts by role:", error);
    return [];
  }
}

/**
 * Fetch review queue for REVIEWER and ADMIN
 * Shows all PENDING posts
 */
export async function getReviewQueue(
  userRole: UserRole,
  limit: number = 20,
  offset: number = 0
): Promise<Post[]> {
  if (userRole !== "ADMIN" && userRole !== "REVIEWER") {
    throw new Error("Unauthorized: Only ADMIN and REVIEWER can access review queue");
  }

  try {
    const result = await db.query.posts.findMany({
      where: eq(posts.status, "PENDING"),
      orderBy: [desc(posts.created_at)],
      limit,
      offset,
    });
    return result as Post[];
  } catch (error) {
    console.error("Error fetching review queue:", error);
    return [];
  }
}

/**
 * Get single post with RBAC check
 */
export async function getPostById(
  postId: string,
  userRole: UserRole,
  userId?: string
): Promise<Post | null> {
  try {
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
    });

    if (!post) return null;

    // RBAC Logic
    if (userRole === "ADMIN" || userRole === "REVIEWER") {
      return post as Post;
    }

    if (userRole === "USER" && userId) {
      // Can view own posts or published posts
      if (post.author_id === userId || post.status === "PUBLISHED") {
        return post as Post;
      }
    }

    if (userRole === "GUEST") {
      // Can only view published posts
      if (post.status === "PUBLISHED") {
        return post as Post;
      }
    }

    return null;
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
  }
}

/**
 * Count posts for dashboard statistics
 */
export async function getPostStats(
  userRole: UserRole,
  userId?: string
): Promise<{ draft: number; pending: number; published: number; rejected: number }> {
  try {
    if (userRole === "USER" && userId) {
      // Only count user's own posts
      const userPosts = await db.query.posts.findMany({
        where: eq(posts.author_id, userId),
      });
      return {
        draft: userPosts.filter((p) => p.status === "DRAFT").length,
        pending: userPosts.filter((p) => p.status === "PENDING").length,
        published: userPosts.filter((p) => p.status === "PUBLISHED").length,
        rejected: userPosts.filter((p) => p.status === "REJECTED").length,
      };
    }

    if (userRole === "ADMIN" || userRole === "REVIEWER") {
      // Count all posts
      const allPosts = await db.query.posts.findMany({});
      return {
        draft: allPosts.filter((p) => p.status === "DRAFT").length,
        pending: allPosts.filter((p) => p.status === "PENDING").length,
        published: allPosts.filter((p) => p.status === "PUBLISHED").length,
        rejected: allPosts.filter((p) => p.status === "REJECTED").length,
      };
    }

    return { draft: 0, pending: 0, published: 0, rejected: 0 };
  } catch (error) {
    console.error("Error fetching post stats:", error);
    return { draft: 0, pending: 0, published: 0, rejected: 0 };
  }
}
