"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { PostCard } from "@/components/PostCard";
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

  const handleApprove = async (postId: string) => {
    setActionLoading(postId);
    try {
      await updatePost(postId, { status: "PUBLISHED" });
      setPosts(posts.map((p) => 
        p.id === postId ? { ...p, status: "PUBLISHED" } : p
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish post");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (postId: string) => {
    setActionLoading(postId);
    try {
      await updatePost(postId, { status: "REJECTED" });
      setPosts(posts.map((p) => 
        p.id === postId ? { ...p, status: "REJECTED" } : p
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject post");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
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
    <div className="min-h-screen bg-gray-50">
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
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600">No pending posts to review.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-lg border border-gray-200 p-6 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {post.title}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Post ID: {post.id.substring(0, 8)}...
                    </p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">PENDING</Badge>
                </div>

                <p className="text-gray-700 line-clamp-3">
                  {post.content.substring(0, 200)}...
                </p>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApprove(post.id)}
                    disabled={actionLoading === post.id}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleReject(post.id)}
                    disabled={actionLoading === post.id}
                    className="gap-2 bg-red-600 hover:bg-red-700"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
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
                  className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between opacity-75"
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
