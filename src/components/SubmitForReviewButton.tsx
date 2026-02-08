"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { submitForReview, getReviewers } from "@/lib/actions/posts";

interface Reviewer {
  id: string;
  email: string;
}

export function SubmitForReviewButton({ postId }: { postId: string }) {
  const router = useRouter();
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [selectedReviewerId, setSelectedReviewerId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingReviewers, setLoadingReviewers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      try {
        const data = await getReviewers();
        setReviewers(data);
        if (data.length > 0) {
          setSelectedReviewerId(data[0].id);
        }
      } catch (err) {
        console.error("Error fetching reviewers:", err);
      } finally {
        setLoadingReviewers(false);
      }
    }

    fetch();
  }, []);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      await submitForReview(postId, selectedReviewerId || undefined);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit for review");
    } finally {
      setLoading(false);
    }
  };

  if (loadingReviewers || reviewers.length === 0) {
    return (
      <Button variant="outline" disabled size="lg" className="border-2 px-6 py-3" style={{ borderColor: "#690031", color: "#690031" }}>
        <Send className="h-5 w-5 mr-2" />
        Submit for Review
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="lg" className="border-2 px-6 py-3" style={{ borderColor: "#690031", color: "#690031" }}>
          <Send className="h-5 w-5 mr-2" />
          Submit for Review
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-gray-900">Submit Post for Review</AlertDialogTitle>
          <AlertDialogDescription>
            Select a reviewer to review your post. The reviewer will be notified.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <style>{`
          #reviewer:focus {
            border-color: #690031;
            box-shadow: 0 0 0 3px rgba(107, 0, 49, 0.1);
          }
        `}</style>

        <div>
          <label htmlFor="reviewer" className="block text-sm font-medium text-gray-700 mb-2">
            Select Reviewer
          </label>
          <select
            id="reviewer"
            value={selectedReviewerId}
            onChange={(e) => setSelectedReviewerId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            {reviewers.map((reviewer) => (
              <option key={reviewer.id} value={reviewer.id}>
                {reviewer.email}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSubmit}
            disabled={loading}
            className="text-white"
            style={{ backgroundColor: "#690031" }}
          >
            {loading ? "Submitting..." : "Submit"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
