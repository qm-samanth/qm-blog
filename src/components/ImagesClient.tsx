"use client";

import { useEffect, useState } from "react";
import { getImages, deleteImage } from "@/lib/actions/images";
import { Button } from "@/components/ui/button";
import { Trash2, Copy, Check } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface ImageData {
  id: string;
  filename: string;
  cloudinary_url: string;
  file_size: number;
  created_at: Date;
  cloudinary_public_id: string;
}

export function ImagesClient() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      setLoading(true);
      const data = await getImages(100, 0);
      setImages(data as ImageData[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load images");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      setDeleting(imageId);
      await deleteImage(imageId);
      setImages(images.filter((img) => img.id !== imageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete image");
    } finally {
      setDeleting(null);
    }
  };

  const copyToClipboard = (url: string, imageId: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(imageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return <div className="text-center py-8">Loading images...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        {error}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">No images uploaded yet.</p>
        <Link href="/admin/images/upload">
          <Button>Upload Your First Image</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-600">{images.length} images total</p>
        <Link href="/admin/images/upload">
          <Button>Upload New Image</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((image) => (
          <div
            key={image.id}
            className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition"
          >
            {/* Image Preview */}
            <div className="relative h-48 bg-gray-100">
              <img
                src={image.cloudinary_url}
                alt={image.filename}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Image Info */}
            <div className="p-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {image.filename}
                </p>
                <p className="text-xs text-gray-500">
                  {(image.file_size / 1024).toFixed(2)} KB
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(image.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* URL Copy Button */}
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(image.cloudinary_url, image.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
                >
                  {copiedId === image.id ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy URL
                    </>
                  )}
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(image.id)}
                  disabled={deleting === image.id}
                  className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting === image.id ? (
                    "Deleting..."
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
