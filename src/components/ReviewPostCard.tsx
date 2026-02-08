"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface ReviewPostCardProps {
  postId: string;
  slug: string;
  title: string;
  content: string;
  authorEmail: string;
  createdAt: Date;
  onApprove: (postId: string, comments: string) => Promise<void>;
  onReject: (postId: string, comments: string) => Promise<void>;
}

export function ReviewPostCard({
  postId,
  slug,
  title,
  content,
  authorEmail,
  createdAt,
  onApprove,
  onReject,
}: ReviewPostCardProps) {
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [comments, setComments] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      await onApprove(postId, comments);
      setShowApproveModal(false);
      setComments("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await onReject(postId, comments);
      setShowRejectModal(false);
      setComments("");
    } finally {
      setIsLoading(false);
    }
  };

  // Strip HTML tags for preview
  const plainText = content
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]*>/g, "")
    .substring(0, 200);

  return (
    <>
      <div className="rounded-lg p-6 bg-white">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <Link href={`/posts/${slug}`} className="hover:underline">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
            </Link>
            <p className="text-sm text-gray-600 mb-3">By: {authorEmail}</p>
            <p className="text-gray-700 text-sm line-clamp-3">{plainText}...</p>
          </div>
          <span className="ml-4 inline-block px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
            PENDING
          </span>
        </div>

        <div className="flex gap-3 mt-4">
          <Button
            onClick={() => setShowApproveModal(true)}
            className="text-white gap-2"
            style={{ backgroundColor: "#690031" }}
            disabled={isLoading}
          >
            <Check className="h-4 w-4" />
            Approve
          </Button>
          <Button
            onClick={() => setShowRejectModal(true)}
            className="text-white gap-2"
            style={{ backgroundColor: "#690031" }}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
            Reject
          </Button>
          <Link href={`/posts/${slug}`}>
            <Button variant="outline">View Full Post</Button>
          </Link>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4" style={{ color: "#690031" }}>Approve Post</h2>
            <p className="text-gray-600 mb-4 text-sm">{title}</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Approval Feedback (Optional)
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add any feedback or congratulations message..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 resize-none"
                style={{ focusRingColor: "#690031" }}
                rows={4}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => {
                  setShowApproveModal(false);
                  setComments("");
                }}
                variant="outline"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApprove}
                className="text-white"
                style={{ backgroundColor: "#690031" }}
                disabled={isLoading}
              >
                {isLoading ? "Approving..." : "Approve"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4" style={{ color: "#690031" }}>Reject Post</h2>
            <p className="text-gray-600 mb-4 text-sm">{title}</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Please explain why this post is being rejected..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 resize-none"
                style={{ focusRingColor: "#690031" }}
                rows={4}
              />
              {!comments && (
                <p className="text-red-500 text-xs mt-1">Please provide a reason for rejection</p>
              )}
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => {
                  setShowRejectModal(false);
                  setComments("");
                }}
                variant="outline"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                className="text-white"
                style={{ backgroundColor: "#690031" }}
                disabled={isLoading || !comments}
              >
                {isLoading ? "Rejecting..." : "Reject"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
