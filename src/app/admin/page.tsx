"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { db } from "@/db";
import { getPostStats } from "@/lib/posts";
import type { UserRole } from "@/types";
import Link from "next/link";
import { CheckSquare, Folder, Image, BookOpen, Tag } from "lucide-react";

interface Stats {
  draft: number;
  pending: number;
  published: number;
  rejected: number;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect if not ADMIN
  if (status === "unauthenticated" || (status === "authenticated" && session?.user.role !== "ADMIN")) {
    redirect("/unauthorized");
  }

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getPostStats("ADMIN");
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
      <div className="min-h-screen" style={{ backgroundColor: "#fbf7f4" }}>
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">Loading admin panel...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#fbf7f4" }}>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your blog platform</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-600">Total Posts</p>
            <p className="text-5xl font-bold text-gray-900 mt-2">
              {stats && stats.draft + stats.pending + stats.published + stats.rejected}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-600">Published</p>
            <p className="text-5xl font-bold text-green-600 mt-2">
              {stats?.published || 0}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-600">Pending Review</p>
            <p className="text-5xl font-bold text-yellow-600 mt-2">
              {stats?.pending || 0}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-600">Draft/Rejected</p>
            <p className="text-5xl font-bold text-red-600 mt-2">
              {stats && stats.draft + stats.rejected}
            </p>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 pb-3 border-b-2" style={{ color: "#690031", borderBottomColor: "#690031" }}>Content Management</h2>
            <div className="space-y-2">
              <Link href="/review" className="block">
                <Button variant="outline" className="w-full justify-start border-2 gap-2" style={{ borderColor: "#690031", color: "#690031" }}>
                  <CheckSquare className="h-4 w-4" />
                  Review Queue
                </Button>
              </Link>
              <Link href="/admin/categories" className="block">
                <Button variant="outline" className="w-full justify-start border-2 gap-2" style={{ borderColor: "#690031", color: "#690031" }}>
                  <Folder className="h-4 w-4" />
                  Manage Categories
                </Button>
              </Link>
              <Link href="/admin/images" className="block">
                <Button variant="outline" className="w-full justify-start border-2 gap-2" style={{ borderColor: "#690031", color: "#690031" }}>
                  <Image className="h-4 w-4" />
                  Manage Images
                </Button>
              </Link>
              <Link href="/admin/tags" className="block">
                <Button variant="outline" className="w-full justify-start border-2 gap-2" style={{ borderColor: "#690031", color: "#690031" }}>
                  <Tag className="h-4 w-4" />
                  Manage Tags
                </Button>
              </Link>
              <Link href="/" className="block">
                <Button variant="outline" className="w-full justify-start border-2 gap-2" style={{ borderColor: "#690031", color: "#690031" }}>
                  <BookOpen className="h-4 w-4" />
                  View All Posts
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 pb-3 border-b-2" style={{ color: "#690031", borderBottomColor: "#690031" }}>System Info</h2>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Role:</strong>{" "}
                <Badge className="ml-2" style={{ backgroundColor: "#690031", color: "white" }}>ADMIN</Badge>
              </div>
              <p>
                <strong>Email:</strong> {session?.user.email}
              </p>
              <p>
                <strong>Name:</strong> {session?.user.email?.split("@")[0]}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
