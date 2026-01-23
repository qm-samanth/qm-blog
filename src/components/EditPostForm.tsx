"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updatePost, getCategories, type CategoryDTO } from "@/lib/actions/posts";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Post {
  id: string;
  title: string;
  content: string;
  category_id?: number;
  status?: string;
}

export function EditPostForm({ post }: { post: Post }) {
  const router = useRouter();
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [categoryId, setCategoryId] = useState<string>(post.category_id?.toString() || "");
  const [cats, setCats] = useState<CategoryDTO[]>([]);
  const [saving, setSaving] = useState(false);
  const [catsLoading, setCatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isPublished = post.status === "PUBLISHED";

  useEffect(() => {
    async function fetchCategories() {
      try {
        const result = await getCategories();
        setCats(result);
      } catch (err) {
        console.error("Error fetching categories:", err);
      } finally {
        setCatsLoading(false);
      }
    }

    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      if (!title.trim() || !content.trim()) {
        throw new Error("Title and content are required");
      }

      await updatePost(post.id, {
        title,
        content,
        categoryId: categoryId ? parseInt(categoryId) : undefined,
      });

      router.push(`/posts/${post.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update post");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {isPublished && (
        <div className="mb-6 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          <strong>Note:</strong> Editing a published post will set it back to <strong>DRAFT</strong> status. You'll need to submit it for review again before it can be published.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter post title"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Category (Optional)
          </label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={catsLoading}
          >
            <option value="">Select a category...</option>
            {cats.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            Content *
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your post content here..."
            rows={12}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Link href={`/posts/${post.id}`} className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </>
  );
}
