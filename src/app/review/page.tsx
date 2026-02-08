"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { PostCard } from "@/components/PostCard";
import { ReviewPostCard } from "@/components/ReviewPostCard";
import { getReviewQueue } from "@/lib/posts";
import { updatePost } from "@/lib/actions/posts";
import type { Post, UserRole } from "@/types";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";

export default function ReviewPage() {
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Redirect if not REVIEWER or ADMIN
  if (status === "unauthenticated" || (status === "authenticated" && session?.user.role !== "REVIEWER" && session?.user.role !== "ADMIN")) {
    redirect("/unauthorized");
  }

  useEffect(() => {
    async function fetchQueue() {
      try {
        setLoading(true);
        const data = await getReviewQueue(
          session?.user.role as UserRole,
          50,
          0
        );
        setPosts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch review queue");
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      fetchQueue();
    }
  }, [session]);

  const handleApprove = async (postId: string, comments: string) => {
    setActionLoading(postId);
    try {
      const response = await fetch(`/api/posts/${postId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments }),
      });

      if (!response.ok) throw new Error("Failed to approve post");
      
      setPosts(posts.filter((p) => p.id !== postId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve post");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (postId: string, comments: string) => {
    setActionLoading(postId);
    try {
      const response = await fetch(`/api/posts/${postId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments }),
      });

      if (!response.ok) throw new Error("Failed to reject post");
      
      setPosts(posts.filter((p) => p.id !== postId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject post");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#fbf7f4" }}>
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">Loading review queue...</div>
        </main>
      </div>
    );
  }

  const pendingPosts = posts.filter((p) => p.status === "PENDING");
  const reviewedPosts = posts.filter((p) => p.status !== "PENDING");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#fbf7f4" }}>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Review Queue</h1>
          <p className="text-gray-600">
            {pendingPosts.length} pending posts awaiting review
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {pendingPosts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600">No pending posts to review.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingPosts.map((post) => (
              <ReviewPostCard
                key={post.id}
                postId={post.id}
                slug={post.slug}
                title={post.title}
                content={post.content}
                authorEmail={post.author_id || "Unknown"}
                createdAt={new Date(post.created_at)}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
        )}

        {reviewedPosts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-4">Reviewed Posts</h2>
            <div className="space-y-4">
              {reviewedPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-lg p-4 flex items-center justify-between opacity-75"
                >
                  <div>
                    <p className="font-medium text-gray-900">{post.title}</p>
                    <p className="text-sm text-gray-600">
                      Status: {post.status}
                    </p>
                  </div>
                  <Badge
                    className={
                      post.status === "PUBLISHED"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }
                  >
                    {post.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
