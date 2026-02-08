"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder, Image as ImageIcon, Trash2, Plus, Copy, Check, Upload, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Folder {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

interface ImageRecord {
  id: string;
  filename: string;
  cloudinary_url: string;
  cloudinary_public_id: string;
  folder_id: string | null;
  user_id: string;
  created_at: string;
}

export default function AdminImagesPage() {
  const { data: session, status } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Redirect if not admin
  if (status === "authenticated" && session?.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [foldersRes, imagesRes] = await Promise.all([
        fetch("/api/folders"),
        fetch("/api/images"),
      ]);

      if (foldersRes.ok) {
        const foldersData = await foldersRes.json();
        setFolders(foldersData || []);
      }
      if (imagesRes.ok) {
        const imagesData = await imagesRes.json();
        setImages(imagesData || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async (imageId: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      const response = await fetch(`/api/images/${imageId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        setImages(images.filter((img) => img.id !== imageId));
      } else {
        console.error("Error deleting image:", data);
        alert(`Failed to delete image: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      alert("Failed to delete image");
    }
  };

  const copyImageUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopying(url);
      setTimeout(() => setCopying(null), 2000);
    } catch (error) {
      console.error("Error copying URL:", error);
      alert("Failed to copy URL");
    }
  };

  const displayImages = selectedFolder
    ? images.filter((img) => img.folder_id === selectedFolder.id)
    : images;

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#fbf7f4" }}>
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <p>Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#fbf7f4" }}>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Link href="/admin" className="flex items-center gap-2 mb-8 hover:opacity-80 transition" style={{ color: "#690031" }}>
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg p-4">
                <h2 className="font-semibold text-gray-900 mb-4">All Users Folders</h2>

                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedFolder(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                      !selectedFolder
                        ? "text-white font-medium"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                    style={!selectedFolder ? { backgroundColor: "#690031" } : {}}
                  >
                    <Folder className="h-4 w-4 inline mr-2" />
                    All Images
                  </button>

                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                        selectedFolder?.id === folder.id
                          ? "text-white font-medium"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                      style={selectedFolder?.id === folder.id ? { backgroundColor: "#690031" } : {}}
                    >
                      <button
                        onClick={() => setSelectedFolder(folder)}
                        className="flex-1 text-left flex items-center"
                      >
                        <Folder className="h-4 w-4 inline mr-2" />
                        {folder.name}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {selectedFolder ? selectedFolder.name : "All Images"}
                  </h1>
                </div>

                {displayImages.length === 0 ? (
                  <div className="text-center py-12">
                    <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {selectedFolder ? "No images in this folder" : "No images yet"}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayImages.map((image) => (
                      <div
                        key={image.id}
                        className="bg-gray-50 rounded-lg overflow-hidden group hover:shadow-md transition-shadow"
                      >
                        <div className="relative overflow-hidden bg-gray-100 h-48">
                          <img
                            src={image.cloudinary_url}
                            alt={image.filename}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>

                        <div className="p-4">
                          <p className="text-xs text-gray-500 mb-1">
                            User: {image.user_id}
                          </p>
                          <p className="text-sm font-medium text-gray-900 truncate mb-3">
                            {image.filename}
                          </p>

                          <div className="flex gap-2">
                            <button
                              onClick={() => copyImageUrl(image.cloudinary_url)}
                              className="flex-1 px-3 py-2 text-sm text-white hover:opacity-90 rounded flex items-center justify-center gap-2"
                              style={{ backgroundColor: "#690031" }}
                            >
                              {copying === image.cloudinary_url ? (
                                <>
                                  <Check className="h-4 w-4" />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="h-4 w-4" />
                                  Copy URL
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => deleteImage(image.id)}
                              className="px-3 py-2 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded flex items-center justify-center"
                              title="Delete image"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
