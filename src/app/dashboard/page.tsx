"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPostStats } from "@/lib/posts";
import Link from "next/link";
import { Plus, Eye } from "lucide-react";

interface Stats {
  draft: number;
  pending: number;
  published: number;
  rejected: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect if not authenticated
  if (status === "unauthenticated") {
    redirect("/auth/signin");
  }

  useEffect(() => {
    async function fetchStats() {
      try {
        const userRole = (session?.user?.role || "USER") as any;
        const data = await getPostStats(userRole, session?.user?.id);
        setStats(data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      fetchStats();
    }
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">Loading dashboard...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Dashboard</h1>
          <p className="text-gray-700 font-medium">Manage your posts and content</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-600">Total Posts</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats && stats.draft + stats.pending + stats.published + stats.rejected}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-600">Published</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {stats?.published || 0}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-600">Pending Review</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {stats?.pending || 0}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-600">Drafts</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {stats?.draft || 0}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/posts/create" className="block">
                <Button className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Post
                </Button>
              </Link>
              <Link href="/" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="h-4 w-4 mr-2" />
                  View All Posts
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Info</h2>
            <div className="space-y-3 text-sm text-gray-800">
              <div>
                <strong>Email:</strong> {session?.user?.email}
              </div>
              <div>
                <strong>Role:</strong>{" "}
                <Badge className="ml-2">{session?.user?.role}</Badge>
              </div>
              {session?.user?.role === "REVIEWER" && (
                <Link href="/review" className="block text-blue-600 hover:text-blue-700 mt-3">
                  → Go to Review Queue
                </Link>
              )}
              {session?.user?.role === "ADMIN" && (
                <Link href="/admin" className="block text-blue-600 hover:text-blue-700 mt-3">
                  → Go to Admin Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
