"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";

interface ReviewActionProps {
  postId: string;
  onReviewed: () => void;
}

export function ReviewAction({ postId, onReviewed }: ReviewActionProps) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReview = async (action: "approve" | "reject") => {
    if (!comments.trim()) {
      setError("Please add comments before submitting");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/reviewer/review-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          action,
          comments: comments.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit review");
      }

      setComments("");
      setShowRejectModal(false);
      setShowApproveModal(false);
      onReviewed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex gap-2 pt-4 border-t">
        <Button
          onClick={() => setShowApproveModal(true)}
          className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
          size="sm"
        >
          <ThumbsUp className="h-4 w-4" />
          Approve
        </Button>
        <Button
          onClick={() => setShowRejectModal(true)}
          variant="destructive"
          className="flex-1 gap-2"
          size="sm"
        >
          <ThumbsDown className="h-4 w-4" />
          Reject
        </Button>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Approve Post</h3>
            <p className="text-gray-600 mb-4">Add comments about this post (approval reasons, feedback, etc.)</p>

            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Enter your approval comments..."
              className="w-full border rounded-lg p-3 mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={4}
            />

            {error && (
              <div className="text-red-600 text-sm mb-4 p-2 bg-red-50 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setShowApproveModal(false);
                  setComments("");
                  setError(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleReview("approve")}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {loading ? "Approving..." : "Approve"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4 text-red-600">Reject Post</h3>
            <p className="text-gray-600 mb-4">Please provide detailed feedback about why this post is being rejected</p>

            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Enter rejection reasons and feedback for improvement..."
              className="w-full border rounded-lg p-3 mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={4}
            />

            {error && (
              <div className="text-red-600 text-sm mb-4 p-2 bg-red-50 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setShowRejectModal(false);
                  setComments("");
                  setError(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleReview("reject")}
                disabled={loading}
                variant="destructive"
                className="flex-1"
              >
                {loading ? "Rejecting..." : "Reject"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
