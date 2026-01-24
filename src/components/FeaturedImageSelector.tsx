"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface FeaturedImageSelectorProps {
  value: string | undefined;
  onChange: (url: string | undefined) => void;
}

export function FeaturedImageSelector({ value, onChange }: FeaturedImageSelectorProps) {
  const [inputUrl, setInputUrl] = useState(value || "");
  const [previewUrl, setPreviewUrl] = useState(value || "");
  const [error, setError] = useState("");

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setInputUrl(url);
    setError("");
  };

  const handleLoadPreview = () => {
    if (!inputUrl.trim()) {
      setError("Please enter a URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(inputUrl);
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    setPreviewUrl(inputUrl);
    onChange(inputUrl);
    setError("");
  };

  const handleRemove = () => {
    setInputUrl("");
    setPreviewUrl("");
    onChange(undefined);
    setError("");
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">Featured Image URL *</label>
      
      <div className="flex gap-2">
        <input
          type="text"
          value={inputUrl}
          onChange={handleUrlChange}
          placeholder="Paste image URL here (e.g., https://...)"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <Button
          type="button"
          onClick={handleLoadPreview}
          className="px-6"
        >
          Preview
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {previewUrl && (
        <div className="space-y-2">
          <img 
            src={previewUrl} 
            alt="Featured image preview" 
            className="h-40 w-full object-cover rounded border"
            onError={() => {
              setError("Failed to load image. Please check the URL.");
              setPreviewUrl("");
              onChange(undefined);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemove}
          >
            Remove Featured Image
          </Button>
        </div>
      )}
    </div>
  );
}
