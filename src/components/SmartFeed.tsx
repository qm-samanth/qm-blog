"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { PostCard } from "@/components/PostCard";
import { PostGridCard } from "@/components/PostGridCard";
import { getPostsByRole } from "@/lib/posts";
import type { Post, UserRole, Category } from "@/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function SmartFeed() {
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/categories");
        if (response.ok) {
          const data = await response.json();
          setCategories([{ id: 0, name: "All", slug: "all" }, ...data]);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    }

    fetchCategories();
  }, []);

  // Fetch posts
  useEffect(() => {
    if (status === "loading") {
      return;
    }

    async function fetchPosts() {
      try {
        setLoading(true);
        const userRole = (session?.user?.role || "GUEST") as UserRole;
        const data = await getPostsByRole(userRole, session?.user?.id, 20);
        
        // Filter by category if selected
        const filtered = selectedCategory && selectedCategory !== 0
          ? data.filter((post) => post.category_id === selectedCategory)
          : data;
        
        setPosts(filtered);
        setLatestPosts(data.slice(0, 5));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch posts");
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [status, session?.user?.id, session?.user?.role, selectedCategory]);

  const handleDelete = (postId: string) => {
    setPosts(posts.filter((p) => p.id !== postId));
  };

  if (loading) {
    return <div className="text-center py-16">
      <div className="inline-block">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    </div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">Error: {error}</div>;
  }

  return (
    <div className="space-y-8">
      {/* Categories Filter */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 pb-2 border-b-2 border-gray-200 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id === 0 ? null : cat.id)}
              className={`px-4 py-2 rounded-sm text-sm font-medium whitespace-nowrap transition-all ${
                (cat.id === 0 && selectedCategory === null) || selectedCategory === cat.id
                  ? "text-white"
                  : "text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200"
              }`}
              style={{
                backgroundColor: ((cat.id === 0 && selectedCategory === null) || selectedCategory === cat.id) ? "#690031" : undefined
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {session?.user?.role === "USER" && (
        <div className="flex justify-center mb-4">
          <Link href="/posts/create">
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700 px-6">
              <Plus className="h-4 w-4" />
              Write New Post
            </Button>
          </Link>
        </div>
      )}

      {/* Main Content with Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Posts Grid - 2 columns */}
        <div className="lg:col-span-2">
          {posts.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg p-8">
              <p className="text-lg text-gray-600 mb-2">No posts found</p>
              <p className="text-gray-500 text-sm">
                {selectedCategory ? "Try selecting a different category" : "Check back later"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {posts.map((post) => (
                <PostGridCard
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

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Latest Posts Widget */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm sticky top-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b-2" style={{ borderColor: "#690031" }}>
              Latest Posts
            </h2>
            <div className="space-y-5">
              {latestPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/posts/${post.slug}`}
                  className="group block"
                >
                  <div className="flex gap-3">
                    {post.featured_image_url && (
                      <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden bg-gray-200">
                        <img
                          src={post.featured_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {post.category && (
                        <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "#690031" }}>
                          {post.category.name}
                        </p>
                      )}
                      <p className="text-sm font-semibold text-gray-900 transition-colors line-clamp-2 group-hover:text-gray-700" style={{ color: "inherit" }}>
                        {post.title}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
