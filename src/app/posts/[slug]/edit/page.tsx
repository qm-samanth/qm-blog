"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { EditPostForm } from "@/components/EditPostForm";
import { Navbar } from "@/components/Navbar";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Post {
  id: string;
  title: string;
  content: string;
  slug: string;
  author_id: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export default async function EditPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  console.log("Edit page - Session user:", session.user);
  console.log("Edit page - Post slug:", slug);

  let post: Post | null = null;
  let error: string | null = null;

  try {
    const result = await db.query.posts.findFirst({
      where: eq(posts.slug, slug),
    });

    // If not found by slug, try by id (UUID)
    let foundPost = result;
    if (!foundPost && slug.includes('-') && slug.length === 36) {
      foundPost = await db.query.posts.findFirst({
        where: eq(posts.id, slug),
      });
    }

    console.log("Edit page - Query result:", foundPost);

    if (!foundPost) {
      error = "Post not found";
    } else {
      post = foundPost as Post;

      // Check authorization - fix: session.user.id should work
      if (session?.user?.id !== post.author_id && session?.user?.role !== "ADMIN") {
        console.log("Authorization check failed", {
          userId: session?.user?.id,
          postAuthor: post.author_id,
          userRole: session?.user?.role,
        });
        error = "You don't have permission to edit this post";
      }
    }
  } catch (err) {
    console.error("Edit page error:", err);
    error = "Failed to load post";
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Link href="/" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Feed
          </Link>
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <p className="text-red-600">{error || "Post not found"}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl">
          <Link href={`/posts/${post.slug}`} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Post
          </Link>

          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Post</h1>
            <EditPostForm post={post} />
          </div>
        </div>
      </main>
    </div>
  );
}
