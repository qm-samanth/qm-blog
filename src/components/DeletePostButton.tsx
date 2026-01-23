"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deletePost } from "@/lib/actions/posts";

export function DeletePostButton({ postId }: { postId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    setDeleting(true);
    try {
      await deletePost(postId);
      router.push("/");
    } catch (err) {
      console.error("Failed to delete post:", err);
      setDeleting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDelete}
      disabled={deleting}
      className="text-red-600 hover:text-red-700"
    >
      <Trash2 className="h-4 w-4 mr-2" />
      {deleting ? "Deleting..." : "Delete"}
    </Button>
  );
}
