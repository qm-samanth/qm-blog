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
import { CheckCircle, XCircle, ArrowLeft, Edit2, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const backLink = session?.user.role === "ADMIN" ? "/admin" : "/reviewer/dashboard";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#fbf7f4" }}>
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href={backLink} className="flex items-center gap-2 mb-8 hover:opacity-80 transition" style={{ color: "#690031" }}>
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Review Queue</h1>
          <p className="text-gray-600">
            {pendingPosts.length} pending posts awaiting review
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded" style={{ backgroundColor: "#f0e6eb", color: "#690031", border: "1px solid #690031" }}>
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
            <h2 className="text-2xl font-bold mb-4 pb-3 border-b-2" style={{ color: "#690031", borderBottomColor: "#690031" }}>Reviewed Posts</h2>
            <div className="bg-white rounded-lg overflow-hidden">
              <table className="w-full">
                <thead style={{ backgroundColor: "#f5dbc6" }}>
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: "#690031" }}>Title</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: "#690031" }}>Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: "#690031" }}>Author</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold" style={{ color: "#690031" }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reviewedPosts.map((post) => (
                    <tr key={post.id} className="transition table-row-hover-reviewed">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{post.title}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          style={{
                            backgroundColor: post.status === "PUBLISHED" ? "#d4edda" : "#f8d7da",
                            color: post.status === "PUBLISHED" ? "#155724" : "#856404",
                          }}
                        >
                          {post.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {post.author_id || "Unknown"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <Link href={`/posts/${post.slug}/edit`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 border-2"
                              style={{ borderColor: "#690031", color: "#690031" }}
                            >
                              <Edit2 className="h-4 w-4" />
                              Edit
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      <style>{`
        .table-row-hover-reviewed:hover {
          background-color: #f5dbc6;
        }
      `}</style>
    </div>
  );
}
