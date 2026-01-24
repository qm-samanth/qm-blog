"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { createPost, getCategories, type CategoryDTO } from "@/lib/actions/posts";
import { Button } from "@/components/ui/button";
import { FeaturedImageSelector } from "@/components/FeaturedImageSelector";
import { Navbar } from "@/components/Navbar";
import { ArrowLeft, Copy, Check } from "lucide-react";
import Link from "next/link";
import { uploadImage } from "@/lib/actions/images";

export default function CreatePostPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | undefined>();
  const [cats, setCats] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [catsLoading, setCatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

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
    if (title && !slugTouched) {
      const generated = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      setSlug(generated);
    }
  }, [title, slugTouched]);

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
    setLoading(true);

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

      const newPost = await createPost({
        title,
        slug,
        content,
        categoryId: parseInt(categoryId),
        featuredImageUrl,
      });

      router.push(`/posts/${newPost.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl">
          <Link href="/" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Feed
          </Link>

          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Post</h1>

            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">URL will be: /posts/{slug || "your-slug"}</p>
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

              {session?.user?.id && (
                <FeaturedImageSelector 
                  value={featuredImageUrl} 
                  onChange={setFeaturedImageUrl}
                />
              )}

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

              {/* Image Upload Section */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <label className="cursor-pointer flex flex-col items-center gap-2">
                  <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-sm text-gray-600">Click to upload an image (will be inserted into content)</span>
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
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Creating..." : "Create Post"}
                </Button>
                <Link href="/" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Note:</strong> Posts are created as DRAFT by default. You can submit them for review later.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
