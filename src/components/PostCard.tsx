"use client";

import { type Post, type UserRole } from "@/types";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye } from "lucide-react";
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
import { useState } from "react";
import { deletePost } from "@/lib/actions/posts";

interface PostCardProps {
  post: Post;
  userRole: UserRole;
  userId?: string;
  onDelete?: (postId: string) => void;
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  PUBLISHED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

export function PostCard({
  post,
  userRole,
  userId,
  onDelete,
}: PostCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  // Determine if user can edit/delete this post
  const canEdit = userRole === "ADMIN" || (userRole === "USER" && post.author_id === userId);
  const canDelete = userRole === "ADMIN" || (userRole === "USER" && post.author_id === userId);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deletePost(post.id);
      onDelete?.(post.id);
    } catch (error) {
      console.error("Error deleting post:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Link href={`/posts/${post.slug}`}>
            <h2 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors">
              {post.title}
            </h2>
          </Link>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Post
            </span>
            <span className="text-sm text-gray-400">•</span>
            <time className="text-sm text-gray-600">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </time>
          </div>
        </div>
        <Badge className={statusColors[post.status]}>
          {post.status}
        </Badge>
      </div>

      {/* Content Preview */}
      <p className="mt-3 line-clamp-3 text-gray-700">
        {post.content.substring(0, 200)}...
      </p>

      {/* Category and Metadata */}
      <div className="mt-4 flex items-center gap-4">
        {post.category && (
          <Link
            href={`/category/${post.category.slug}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            {post.category.name}
          </Link>
        )}
      </div>

      {/* Action Buttons - Conditional Rendering */}
      <div className="mt-4 flex items-center gap-2">
        <Link href={`/posts/${post.slug}`}>
          <Button variant="outline" size="sm" className="gap-2">
            <Eye className="h-4 w-4" />
            View
          </Button>
        </Link>

        {canEdit && (
          <Link href={`/posts/${post.slug}/edit`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </Link>
        )}

        {canDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-red-600 hover:text-red-700"
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Post</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{post.title}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex gap-3">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </article>
  );
}
