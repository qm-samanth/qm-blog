"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updatePost, getCategories, type CategoryDTO } from "@/lib/actions/posts";
import { uploadImage } from "@/lib/actions/images";
import { Button } from "@/components/ui/button";
import { FeaturedImageSelector } from "@/components/FeaturedImageSelector";
import { TagSelector } from "@/components/TagSelector";
import { RichTextEditor } from "@/components/RichTextEditor";
import { PreviewModal } from "@/components/PreviewModal";
import Link from "next/link";
import { Check } from "lucide-react";

interface Post {
  id: string;
  title: string;
  content: string;
  slug: string;
  category_id?: number;
  status?: string;
  featured_image_url?: string;
}

export function EditPostForm({ post }: { post: Post }) {
  const router = useRouter();
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [slugTouched, setSlugTouched] = useState(false);
  const [content, setContent] = useState(post.content);
  const [excerpt, setExcerpt] = useState((post as any).excerpt || "");
  const [categoryId, setCategoryId] = useState<string>(post.category_id?.toString() || "");
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | undefined>(post.featured_image_url);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [cats, setCats] = useState<CategoryDTO[]>([]);
  const [saving, setSaving] = useState(false);
  const [catsLoading, setCatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
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

  // Auto-generate slug from title on title change (only if user hasn't manually edited slug)
  useEffect(() => {
    if (title && !slugTouched && title !== post.title) {
      const generated = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      setSlug(generated);
    }
  }, [title, slugTouched, post.title]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        try {
          const result = await uploadImage({
            base64,
            filename: file.name,
            fileSize: file.size,
          });

          // Insert markdown syntax into content
          const imageMarkdown = `![${file.name}](${result.url})`;
          setContent(content + "\n\n" + imageMarkdown + "\n\n");
          setCopiedUrl(result.url);
          setTimeout(() => setCopiedUrl(null), 2000);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Upload failed");
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read file");
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      if (!title.trim() || !content.trim()) {
        throw new Error("Title and content are required");
      }

      if (!categoryId) {
        throw new Error("Category is required");
      }

      if (!slug.trim()) {
        throw new Error("URL slug is required");
      }

      if (!featuredImageUrl?.trim()) {
        throw new Error("Featured image URL is required");
      }

      if (selectedTagIds.length === 0) {
        throw new Error("Please select at least one tag");
      }

      await updatePost(post.id, {
        title,
        slug,
        content,
        excerpt,
        categoryId: parseInt(categoryId),
        featuredImageUrl,
      });

      // Save tags
      await fetch(`/api/posts/${post.id}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagIds: selectedTagIds }),
      });

      router.push(`/posts/${slug}`);
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
        <div className="mb-6 p-4 rounded" style={{ backgroundColor: "#f0e6eb", borderLeft: "4px solid #690031", color: "#690031" }}>
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-transparent focus:border-transparent"
            style={{ outline: "none" }}
            required
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
            URL Slug *
          </label>
          <input
            id="slug"
            type="text"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
              setSlugTouched(true);
            }}
            placeholder="auto-generated from title"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-transparent focus:border-transparent"
            style={{ outline: "none" }}
            required
          />
          <p className="text-xs text-gray-500 mt-1">URL will be: /posts/{slug || "your-slug"}</p>
        </div>

        <div>
          <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
            Short Description (Excerpt)
          </label>
          <textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="A brief summary of your post (2-3 sentences)"
            maxLength={200}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-transparent focus:border-transparent resize-none"
            style={{ outline: "none" }}
          />
          <p className="text-xs text-gray-500 mt-1">{excerpt.length}/200 characters</p>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-transparent focus:border-transparent"
            style={{ outline: "none" }}
            disabled={catsLoading}
            required
          >
            <option value="">Select a category...</option>
            {cats.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <FeaturedImageSelector 
          value={featuredImageUrl} 
          onChange={setFeaturedImageUrl}
        />

        <TagSelector
          postId={post.id}
          onTagsChange={setSelectedTagIds}
        />

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Content *
            </label>
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="px-3 py-1 text-xs text-white rounded hover:opacity-80 transition"
              style={{ backgroundColor: "#690031" }}
            >
              Preview
            </button>
          </div>
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Write your post content here..."
          />
        </div>

        {/* Image Upload Section */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <label className="cursor-pointer flex flex-col items-center gap-2">
            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
          {uploading && <p className="text-center text-sm text-gray-600 mt-2">Uploading...</p>}
          {copiedUrl && (
            <p className="text-center text-sm text-green-600 mt-2 flex items-center justify-center gap-2">
              <Check className="h-4 w-4" /> Image inserted into content!
            </p>
          )}
        </div>

        <div className="flex gap-4">
          <Button 
            type="submit" 
            disabled={saving} 
            className="flex-1 text-white"
            style={{ backgroundColor: "#690031" }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Link href={`/posts/${post.slug}`} className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
        </div>
      </form>

      <PreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        content={content}
        title={title}
      />
    </>
  );
}
