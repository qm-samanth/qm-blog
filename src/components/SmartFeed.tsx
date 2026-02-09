"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { PostCard } from "@/components/PostCard";
import { PostGridCard } from "@/components/PostGridCard";
import { getPostsByRole } from "@/lib/posts";
import type { Post, UserRole, Category } from "@/types";
import Link from "next/link";

export function SmartFeed() {
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPosts, setTotalPosts] = useState(0);
  const itemsPerPage = 2;

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
        const offset = currentPage * itemsPerPage;
        
        // Fetch paginated posts
        const data = await getPostsByRole(userRole, session?.user?.id, itemsPerPage, offset);
        
        // Filter by category if selected
        const filtered = selectedCategory && selectedCategory !== 0
          ? data.filter((post) => post.category_id === selectedCategory)
          : data;
        
        // For total count, fetch all posts for the count
        const allPosts = await getPostsByRole(userRole, session?.user?.id, 10000, 0);
        const allFiltered = selectedCategory && selectedCategory !== 0
          ? allPosts.filter((post) => post.category_id === selectedCategory)
          : allPosts;
        
        setPosts(filtered);
        setTotalPosts(allFiltered.length);
        setLatestPosts(allPosts.slice(0, 5));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch posts");
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [status, session?.user?.id, session?.user?.role, selectedCategory, currentPage]);

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
        <div className="flex flex-wrap gap-2 pb-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id === 0 ? null : cat.id);
                setCurrentPage(0);
              }}
              className={`px-4 py-2 rounded-sm text-sm font-medium whitespace-nowrap transition-all ${
                (cat.id === 0 && selectedCategory === null) || selectedCategory === cat.id
                  ? "text-white"
                  : "text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50"
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
            <>
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
              
              {/* Pagination Controls */}
              <div className="flex items-center justify-center mt-8 px-4 py-6 bg-gray-50 rounded-lg gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                  className="px-3 py-2 rounded font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 hover:bg-white"
                >
                  ←
                </button>
                
                {/* Page Numbers */}
                {Array.from({ length: Math.ceil(totalPosts / itemsPerPage) || 1 }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(index)}
                    className={`px-4 py-2 rounded font-medium transition-all border ${
                      currentPage === index
                        ? "border-gray-400"
                        : "border-gray-300 hover:bg-white"
                    }`}
                    style={{
                      backgroundColor: currentPage === index ? "#690031" : undefined,
                      color: currentPage === index ? "white" : undefined,
                    }}
                  >
                    {index + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={posts.length < itemsPerPage || (currentPage + 1) * itemsPerPage >= totalPosts}
                  className="px-3 py-2 rounded font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 hover:bg-white"
                >
                  →
                </button>
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Latest Posts Widget */}
          <div className="bg-white rounded-lg p-6 shadow-sm sticky top-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b-2" style={{ borderColor: "#690031" }}>
              Latest Posts
            </h2>
            <div className="space-y-5">
              {latestPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/posts/${post.slug}`}
                  className="group block rounded p-3 transition-colors hover:opacity-90"
                  style={{ backgroundColor: "#fdfaf7" }}
                >
                  <div className="flex gap-3 items-center">
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
                      <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                        {(post as any).excerpt || post.content?.replace(/<[^>]*>/g, '').substring(0, 100).trim() + "..."}
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
