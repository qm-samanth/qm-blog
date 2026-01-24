"use client";

import { useState } from "react";
import { uploadImage } from "@/lib/actions/images";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";

interface ImageUploadProps {
  onImageAdded: (url: string, publicId: string) => void;
}

export function ImageUpload({ onImageAdded }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;

        try {
          const result = await uploadImage({
            base64,
            filename: file.name,
            fileSize: file.size,
          });

          setPreview(result.url);
          onImageAdded(result.url, result.publicId);
          
          // Reset input
          e.target.value = "";
        } catch (err) {
          setError(err instanceof Error ? err.message : "Upload failed");
          setPreview(null);
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

  const clearPreview = () => {
    setPreview(null);
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <label className="cursor-pointer flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-gray-400" />
          <span className="text-sm text-gray-600">Click to upload an image</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {preview && (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="max-h-48 rounded-lg"
          />
          <button
            onClick={clearPreview}
            className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <Button disabled={uploading} type="button">
        {uploading ? "Uploading..." : "Upload Image"}
      </Button>
    </div>
  );
}
