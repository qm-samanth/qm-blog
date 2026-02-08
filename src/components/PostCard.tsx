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
import { useState, useEffect } from "react";
import { deletePost } from "@/lib/actions/posts";
import { PostTagsDisplay } from "@/components/PostTagsDisplay";

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

interface Tag {
  id: number;
  name: string;
  slug: string;
}

export function PostCard({
  post,
  userRole,
  userId,
  onDelete,
}: PostCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);

  // Fetch tags for this post
  useEffect(() => {
    async function fetchTags() {
      try {
        setTagsLoading(true);
        const response = await fetch(`/api/posts/${post.id}/tags`);
        if (response.ok) {
          const data = await response.json();
          setTags(data);
        }
      } catch (error) {
        console.error("Error fetching tags:", error);
      } finally {
        setTagsLoading(false);
      }
    }

    fetchTags();
  }, [post.id]);

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

  const preview = getPlainTextPreview(post.content, 180);

  return (
    <article className="rounded-sm shadow-sm hover:shadow-lg transition-shadow overflow-hidden bg-white">
      {/* Image and Title Section */}
      {post.featured_image_url ? (
        <div className="relative h-80 bg-gray-200 overflow-hidden group">
          <img
            src={post.featured_image_url}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Glossy Effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
          {/* Status Badge */}
          <div className="absolute top-4 right-4">
            <Badge className={`${statusColors[post.status]} font-semibold`}>
              {post.status}
            </Badge>
          </div>
        </div>
      ) : (
        <div className="h-80 flex items-center justify-center relative bg-white">
          <div className="text-center px-6">
            <Link href={`/posts/${post.slug}`}>
              <h2 className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                {post.title}
              </h2>
            </Link>
          </div>
          {/* Status Badge */}
          <div className="absolute top-4 right-4">
            <Badge className={`${statusColors[post.status]} font-semibold`}>
              {post.status}
            </Badge>
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className="p-6">
        {/* Metadata Row */}
        <div className="flex items-center gap-3 mb-4 text-sm text-gray-600">
          <span className="font-medium text-gray-700">{post.author?.email || "Author"}</span>
          <span className="text-gray-300">•</span>
          <time className="text-gray-600">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </time>
        </div>

        {/* Category Badge */}
        {posTitle */}
        <Link href={`/posts/${post.slug}`}>
          <h2 className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors mb-4">
            {post.title}
          </h2>
        </Link>
        {/* t.category && (
          <Link
            href={`/category/${post.category.slug}`}
            className="inline-block mb-4"
          >
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
              📁 {post.category.name}
            </span>
          </Link>
        )}

        {/* Preview Text */}
        {preview && (
          <p className="text-gray-700 mb-4 leading-6 line-clamp-7">
            {preview}
          </p>
        )}

        {/* Tags Section */}
        {!tagsLoading && tags.length > 0 && (
          <div className="mb-5">
            <PostTagsDisplay tags={tags} />
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-100 my-4"></div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {canEdit && (
              <Link href={`/posts/${post.slug}/edit`}>
                <Button variant="outline" size="sm" className="gap-2 text-gray-600 hover:bg-gray-50">
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
                    className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
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

          <Link href={`/posts/${post.slug}`}>
            <Button size="sm" className="gap-2 text-white rounded-sm font-semibold shadow-md transition-all duration-200 hover:shadow-lg active:scale-95 hover:opacity-90 px-4" style={{ backgroundColor: "#690031" }}>
              <Eye className="h-4 w-4" />
              Read
            </Button>
          </Link>
        </div>
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
