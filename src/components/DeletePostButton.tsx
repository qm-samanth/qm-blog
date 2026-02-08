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
      size="lg"
      onClick={handleDelete}
      disabled={deleting}
      className="border-2 px-6 py-3"
      style={{ borderColor: "#690031", color: "#690031" }}
    >
      <Trash2 className="h-5 w-5 mr-2" />
      {deleting ? "Deleting..." : "Delete"}
    </Button>
  );
}
