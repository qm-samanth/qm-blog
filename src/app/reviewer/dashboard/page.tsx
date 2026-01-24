"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { ReviewAction } from "@/components/ReviewAction";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface PendingPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  featured_image_url?: string;
  created_at: string;
  author: {
    id: string;
    email: string;
  };
}

export default function ReviewerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<PendingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewedPostId, setReviewedPostId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated" && session?.user?.role !== "REVIEWER" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }

    if (status === "authenticated") {
      fetchPendingPosts();
    }
  }, [status, session, router]);

  const fetchPendingPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/reviewer/pending-posts");
      if (!response.ok) throw new Error("Failed to fetch pending posts");
      const data = await response.json();
      setPosts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleReviewComplete = () => {
    fetchPendingPosts();
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-8">Posts for Review</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8">
            {error}
          </div>
        )}

        {posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 text-lg">No posts pending review</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {posts.map((post) => (
              <div
                key={post.id}
                className={`bg-white rounded-lg shadow overflow-hidden transition-opacity ${
                  reviewedPostId === post.id ? "opacity-50" : ""
                }`}
              >
                {post.featured_image_url && (
                  <img
                    src={post.featured_image_url}
                    alt={post.title}
                    className="w-full h-48 object-cover"
                  />
                )}

                <div className="p-6">
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold mb-2">{post.title}</h2>
                    <p className="text-sm text-gray-600 mb-3">
                      By {post.author.email} • {new Date(post.created_at).toLocaleDateString()}
                    </p>

                    <div
                      className="prose prose-sm max-w-none line-clamp-3"
                      dangerouslySetInnerHTML={{
                        __html: post.content
                          .slice(0, 300)
                          .replace(/<[^>]*>/g, "")
                          .substring(0, 200) + "...",
                      }}
                    />
                  </div>

                  {reviewedPostId !== post.id ? (
                    <ReviewAction
                      postId={post.id}
                      onReviewed={() => {
                        setReviewedPostId(post.id);
                        setTimeout(() => handleReviewComplete(), 1000);
                      }}
                    />
                  ) : (
                    <div className="pt-4 text-center text-green-600 font-medium">
                      ✓ Post reviewed successfully
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
