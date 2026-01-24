"use client";

import { useState } from "react";
import { uploadImage } from "@/lib/actions/images";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

export function ImageUploadForm() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setSelectedFile(file);

    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setError("Please select an image");
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
            filename: selectedFile.name,
            fileSize: selectedFile.size,
          });

          // Redirect back to images list
          router.push("/admin/images");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Upload failed");
          setUploading(false);
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process file");
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* File Input */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
        <label className="cursor-pointer flex flex-col items-center gap-3 text-center">
          <Upload className="h-12 w-12 text-gray-400" />
          <div>
            <p className="text-lg font-medium text-gray-900">Click to upload</p>
            <p className="text-sm text-gray-500">PNG, JPG, GIF up to 5MB</p>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Preview */}
      {preview && (
        <div>
          <p className="text-sm font-medium text-gray-900 mb-2">Preview</p>
          <img
            src={preview}
            alt="Preview"
            className="max-h-72 rounded-lg border border-gray-200"
          />
        </div>
      )}

      {/* File Info */}
      {selectedFile && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">File:</span> {selectedFile.name}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Size:</span>{" "}
            {(selectedFile.size / 1024).toFixed(2)} KB
          </p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={uploading || !selectedFile}
        className="w-full"
      >
        {uploading ? "Uploading..." : "Upload Image"}
      </Button>
    </form>
  );
}
