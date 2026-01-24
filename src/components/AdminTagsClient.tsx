"use client";

import { useState, useEffect } from "react";
import { Trash2, Edit2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Tag {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export function AdminTagsClient() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [editingTagName, setEditingTagName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch tags
  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/tags");
      if (response.ok) {
        const data = await response.json();
        setTags(data);
      } else {
        setError("Failed to fetch tags");
      }
    } catch (err) {
      setError("Error fetching tags");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) {
      setError("Tag name is required");
      return;
    }

    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName }),
      });

      if (response.ok) {
        const newTag = await response.json();
        setTags((prev) => [...prev, newTag]);
        setNewTagName("");
        setSuccess("Tag created successfully!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create tag");
      }
    } catch (err) {
      setError("Error creating tag");
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateTag = async (tagId: number) => {
    if (!editingTagName.trim()) {
      setError("Tag name is required");
      return;
    }

    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingTagName }),
      });

      if (response.ok) {
        const updatedTag = await response.json();
        setTags((prev) =>
          prev.map((tag) => (tag.id === tagId ? updatedTag : tag))
        );
        setEditing(null);
        setEditingTagName("");
        setSuccess("Tag updated successfully!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update tag");
      }
    } catch (err) {
      setError("Error updating tag");
      console.error(err);
    }
  };

  const handleDeleteTag = async (tagId: number) => {
    if (!confirm("Are you sure you want to delete this tag?")) return;

    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTags((prev) => prev.filter((tag) => tag.id !== tagId));
        setSuccess("Tag deleted successfully!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to delete tag");
      }
    } catch (err) {
      setError("Error deleting tag");
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-600">Loading tags...</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-start justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-700 hover:text-red-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded flex items-start justify-between">
          <span>{success}</span>
          <button
            onClick={() => setSuccess(null)}
            className="text-green-700 hover:text-green-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Create New Tag Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Create New Tag
        </h2>
        <form onSubmit={handleCreateTag} className="flex gap-2">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Enter tag name..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button
            type="submit"
            disabled={creating || !newTagName.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {creating ? "Creating..." : "Create"}
          </Button>
        </form>
      </div>

      {/* Tags List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            All Tags ({tags.length})
          </h2>
        </div>

        {tags.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No tags yet. Create one to get started!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {tags.map((tag) => (
                  <tr
                    key={tag.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4">
                      {editing === tag.id ? (
                        <input
                          type="text"
                          value={editingTagName}
                          onChange={(e) => setEditingTagName(e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <span className="font-medium text-gray-900">
                          {tag.name}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {tag.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(tag.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {editing === tag.id ? (
                          <>
                            <button
                              onClick={() =>
                                handleUpdateTag(tag.id)
                              }
                              className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm font-medium transition"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditing(null)}
                              className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium transition"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditing(tag.id);
                                setEditingTagName(tag.name);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                              title="Edit tag"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTag(tag.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                              title="Delete tag"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
