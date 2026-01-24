"use client";

import { X } from "lucide-react";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  title: string;
}

// Helper to decode HTML entities
const decodeHtml = (html: string) => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = html;
  return textarea.value;
};

export function PreviewModal({ isOpen, onClose, content, title }: PreviewModalProps) {
  if (!isOpen) return null;

  // Decode the content in case it's HTML-escaped
  const decodedContent = decodeHtml(content);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">Content Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">{title}</h1>
          </div>

          <div className="prose prose-sm md:prose-base lg:prose-lg max-w-none text-gray-900">
            <div 
              className="space-y-4 leading-7"
              dangerouslySetInnerHTML={{ __html: decodedContent }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
