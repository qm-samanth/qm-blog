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

// Strip HTML tags and get plain text preview
function getPlainTextPreview(html: string, maxLength: number = 200): string {
  // Remove all HTML tags
  let plainText = html.replace(/<[^>]*>/g, '');
  
  // Decode common HTML entities
  plainText = plainText
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  
  // Clean up whitespace
  plainText = plainText.replace(/\s+/g, ' ').trim();
  
  // Truncate to maxLength
  if (plainText.length > maxLength) {
    return plainText.substring(0, maxLength).trim() + '...';
  }
  return plainText;
}

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
    <article className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Image and Title Section */}
      {post.featured_image_url ? (
        <div className="relative h-64 bg-gray-200 overflow-hidden group">
          <img
            src={post.featured_image_url}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Title Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
            <Link href={`/posts/${post.slug}`}>
              <h2 className="text-xl font-semibold text-white hover:text-blue-200 transition-colors line-clamp-2">
                {post.title}
              </h2>
            </Link>
          </div>
          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <Badge className={statusColors[post.status]}>
              {post.status}
            </Badge>
          </div>
        </div>
      ) : (
        <div className="h-64 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center relative">
          <div className="text-center">
            <Link href={`/posts/${post.slug}`}>
              <h2 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors px-4">
                {post.title}
              </h2>
            </Link>
          </div>
          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <Badge className={statusColors[post.status]}>
              {post.status}
            </Badge>
          </div>
        </div>
      )}

      {/* Metadata and Actions */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-600">
            Post
          </span>
          <span className="text-sm text-gray-400">•</span>
          <time className="text-sm text-gray-600">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </time>
        </div>

        {/* Category and Metadata */}
        {post.category && (
          <Link
            href={`/category/${post.category.slug}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 block mb-4"
          >
            {post.category.name}
          </Link>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
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
      </div>
    </article>
  );
}
