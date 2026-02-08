"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit2, Plus, ArrowLeft, X } from "lucide-react";
import Link from "next/link";
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
import {
  getCategories,
  deleteCategory,
  createCategory,
  updateCategory,
} from "@/lib/actions/categories";

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function AdminCategoriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", slug: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user.role !== "ADMIN") {
      router.push("/unauthorized");
    }
  }, [status, session?.user.role, router]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch categories");
      } finally {
        setLoading(false);
      }
    }

    if (status === "authenticated") {
      fetchCategories();
    }
  }, [status]);

  const handleDelete = async (id: number) => {
    try {
      await deleteCategory(id);
      setCategories(categories.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete category");
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({ name: category.name, slug: category.slug });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (!formData.name.trim() || !formData.slug.trim()) {
        throw new Error("Name and slug are required");
      }

      if (editingId) {
        const updated = await updateCategory(editingId, formData);
        setCategories(
          categories.map((c) => (c.id === editingId ? updated : c))
        );
      } else {
        const newCategory = await createCategory(formData);
        setCategories([...categories, newCategory]);
      }

      setFormData({ name: "", slug: "" });
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", slug: "" });
    setEditingId(null);
    setShowForm(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#fbf7f4" }}>
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">Loading categories...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#fbf7f4" }}>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/admin" className="flex items-center gap-2 mb-8 hover:opacity-80 transition" style={{ color: "#690031" }}>
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold" style={{ color: "#690031" }}>Manage Categories</h1>
              {!showForm && (
                <Button onClick={() => setShowForm(true)} className="gap-2 text-white" style={{ backgroundColor: "#690031" }}>
                  <Plus className="h-4 w-4" />
                  New Category
                </Button>
              )}
            </div>

            {error && (
              <div className="p-4 rounded flex items-start justify-between" style={{ backgroundColor: "#f0e6eb", color: "#690031", border: "1px solid #690031" }}>
                <span>{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="hover:opacity-70"
                  style={{ color: "#690031" }}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Form */}
            {showForm && (
              <div className="bg-white rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-3 flex items-center gap-2 border-b-2" style={{ color: "#690031", borderBottomColor: "#690031" }}>
                  <Plus className="h-5 w-5" />
                  {editingId ? "Edit Category" : "Create New Category"}
                </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
                    Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Category name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ "--focus-ring-color": "#690031" } as any}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-900 mb-2">
                    Slug *
                  </label>
                  <input
                    id="slug"
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="category-slug"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ "--focus-ring-color": "#690031" } as any}
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="text-white"
                    style={{ backgroundColor: "#690031" }}
                  >
                    {submitting ? "Saving..." : editingId ? "Update Category" : "Save Category"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

            {/* Categories List */}
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="p-6 border-b-2" style={{ borderBottomColor: "#690031" }}>
                <h2 className="text-xl font-semibold text-gray-900" style={{ color: "#690031" }}>
                  All Categories ({categories.length})
                </h2>
              </div>

              {categories.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No categories yet. Create one to get started!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                <thead style={{ backgroundColor: "#f5dbc6" }}>
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: "#690031" }}>Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: "#690031" }}>Slug</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold" style={{ color: "#690031" }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {categories.map((category) => (
                    <tr key={category.id} className="transition table-row-hover-cat">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{category.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge style={{ backgroundColor: "#f5dbc6", color: "#690031" }}>{category.slug}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleEdit(category)}
                            className="p-2 rounded transition"
                            style={{ color: "#690031" }}
                            title="Edit category"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                className="p-2 rounded transition"
                                style={{ color: "#690031" }}
                                title="Delete category"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{category.name}"? This action cannot be undone.
                                  Posts with this category will have their category removed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="flex gap-3">
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(category.id)}
                                  className="text-white"
                                  style={{ backgroundColor: "#690031" }}
                                >
                                  Delete
                                </AlertDialogAction>
                              </div>
                            </AlertDialogContent>
                          </AlertDialog>
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
        </div>
      </main>
      <style>{`
        .table-row-hover-cat:hover {
          background-color: #f5dbc6;
        }
      `}</style>
    </div>
  );
}
