"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { PostCard } from "@/components/PostCard";
import { getPostsByRole } from "@/lib/posts";
import type { Post, UserRole } from "@/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function SmartFeed() {
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch when session status is determined
    if (status === "loading") {
      return;
    }

    async function fetchPosts() {
      try {
        setLoading(true);
        const userRole = (session?.user?.role || "GUEST") as UserRole;
        const data = await getPostsByRole(userRole, session?.user?.id, 20);
        setPosts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch posts");
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [status, session?.user?.id, session?.user?.role]);

  const handleDelete = (postId: string) => {
    setPosts(posts.filter((p) => p.id !== postId));
  };

  if (loading) {
    return <div className="text-center py-8">Loading posts...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Blog Feed</h1>
        {session?.user.role === "USER" && (
          <Link href="/posts/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Post
            </Button>
          </Link>
        )}
      </div>

      {/* Posts List */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No posts found.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              userRole={(session?.user?.role || "GUEST") as UserRole}
              userId={session?.user?.id}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
