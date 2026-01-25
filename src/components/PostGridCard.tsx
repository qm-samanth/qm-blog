"use client";

import { type Post, type UserRole } from "@/types";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye, MessageCircle } from "lucide-react";
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
import { useState, useEffect } from "react";
import { deletePost } from "@/lib/actions/posts";

interface PostGridCardProps {
  post: Post;
  userRole: UserRole;
  userId?: string;
  onDelete?: (postId: string) => void;
}

// Strip HTML tags and get plain text preview
function getPlainTextPreview(html: string, maxLength: number = 150): string {
  let plainText = html.replace(/<[^>]*>/g, '');
  plainText = plainText
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  plainText = plainText.replace(/\s+/g, ' ').trim();
  if (plainText.length > maxLength) {
    return plainText.substring(0, maxLength).trim() + '...';
  }
  return plainText;
}

export function PostGridCard({
  post,
  userRole,
  userId,
  onDelete,
}: PostGridCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
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

  const preview = (post as any).excerpt || getPlainTextPreview(post.content, 140);

  return (
    <article className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      {/* Featured Image */}
      {post.featured_image_url ? (
        <Link href={`/posts/${post.slug}`}>
          <div className="relative h-48 bg-gray-200 overflow-hidden group">
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            {post.status !== "PUBLISHED" && (
              <div className="absolute top-3 right-3 bg-white/90 text-gray-900 px-3 py-1 rounded-full text-xs font-semibold">
                {post.status}
              </div>
            )}
          </div>
        </Link>
      ) : (
        <div className="h-48 bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="text-4xl mb-2">📄</div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        {/* Category */}
        {post.category && (
          <Link href={`/category/${post.category.slug}`}>
            <span className="inline-block text-xs font-bold text-teal-600 uppercase tracking-wide mb-2 hover:text-teal-700">
              {post.category.name}
            </span>
          </Link>
        )}

        {/* Title */}
        <Link href={`/posts/${post.slug}`}>
          <h3 className="text-lg font-bold text-gray-900 hover:text-teal-600 transition-colors mb-3 line-clamp-2">
            {post.title}
          </h3>
        </Link>

        {/* Preview Text */}
        {preview && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-grow">
            {preview}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4 pb-3 border-t border-gray-100 pt-3">
          <span>
            by <span className="font-medium text-gray-700">shufflehound</span>
          </span>
          <span>
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/posts/${post.slug}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full gap-2 border-gray-300 text-gray-700 hover:bg-gray-50">
              <Eye className="h-3.5 w-3.5" />
              <span className="text-xs">View</span>
            </Button>
          </Link>

          {canEdit && (
            <Link href={`/posts/${post.slug}/edit`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full gap-2 border-gray-300 text-gray-700 hover:bg-gray-50">
                <Edit className="h-3.5 w-3.5" />
                <span className="text-xs">Edit</span>
              </Button>
            </Link>
          )}

          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2 border-red-300 text-red-600 hover:bg-red-50"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="text-xs">Delete</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-gray-900">Delete Post</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-600">
                    Are you sure you want to delete "{post.title}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex gap-3">
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700 text-white"
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
