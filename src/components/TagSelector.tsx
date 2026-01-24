"use client";

import { useEffect, useState } from "react";

interface Tag {
  id: number;
  name: string;
  slug: string;
}

interface TagSelectorProps {
  postId?: string;
  onTagsChange: (tagIds: number[]) => void;
}

export function TagSelector({ postId, onTagsChange }: TagSelectorProps) {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch all tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch("/api/tags");
        if (response.ok) {
          const tags = await response.json();
          setAllTags(tags);
        }
      } catch (error) {
        console.error("Error fetching tags:", error);
      } finally {
        setLoading(false);
      }
    };

    // Check if user is admin
    const checkAdmin = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const session = await response.json();
          setIsAdmin(session?.user?.role === "ADMIN");
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
      }
    };

    fetchTags();
    checkAdmin();
  }, []);

  // Fetch tags for this post
  useEffect(() => {
    if (!postId) return;

    const fetchPostTags = async () => {
      try {
        const response = await fetch(`/api/posts/${postId}/tags`);
        if (response.ok) {
          const postTagList = await response.json();
          const tagIds = postTagList.map((t: Tag) => t.id);
          setSelectedTagIds(tagIds);
        }
      } catch (error) {
        console.error("Error fetching post tags:", error);
      }
    };

    fetchPostTags();
  }, [postId]);

  // Notify parent of tag changes
  useEffect(() => {
    onTagsChange(selectedTagIds);
  }, [selectedTagIds, onTagsChange]);

  const handleTagToggle = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim() || !isAdmin) return;

    setCreating(true);
    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName }),
      });

      if (response.ok) {
        const newTag = await response.json();
        setAllTags((prev) => [...prev, newTag]);
        setSelectedTagIds((prev) => [...prev, newTag.id]);
        setNewTagName("");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create tag");
      }
    } catch (error) {
      console.error("Error creating tag:", error);
      alert("Error creating tag");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading tags...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Tags <span className="text-red-500">*</span>
        </label>

        {allTags.length === 0 ? (
          <div className="text-gray-500 text-sm">
            {isAdmin
              ? "No tags created yet. Create one below."
              : "No tags available. Admin needs to create some."}
          </div>
        ) : (
          <div className="space-y-2 bg-gray-50 p-3 rounded-lg max-h-64 overflow-y-auto">
            {allTags.map((tag) => (
              <label key={tag.id} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTagIds.includes(tag.id)}
                  onChange={() => handleTagToggle(tag.id)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{tag.name}</span>
              </label>
            ))}
          </div>
        )}

        <div className="mt-2 text-sm text-gray-600">
          Selected: {selectedTagIds.length} tag{selectedTagIds.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Admin-only: Create new tag */}
      {isAdmin && (
        <div className="pt-4 border-t">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Create New Tag (Admin Only)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleCreateTag();
              }}
              placeholder="Enter tag name..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleCreateTag}
              disabled={!newTagName.trim() || creating}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition"
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
