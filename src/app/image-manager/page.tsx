"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder, Image as ImageIcon, Trash2, Plus, Copy, Check, Upload } from "lucide-react";
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

export default function ImageManagerPage() {
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#fbf7f4" }}>
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <p className="text-red-600">Please sign in to access the image manager.</p>
        </main>
      </div>
    );
  }

  useEffect(() => {
    if (session?.user?.id) {
      fetchData();
    }
  }, [session]);

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

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName }),
      });

      const data = await response.json();

      if (response.ok) {
        setFolders([...folders, data]);
        setNewFolderName("");
      } else {
        console.error("Error creating folder:", data);
        alert(`Failed to create folder: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      alert("Failed to create folder");
    }
  };

  const deleteFolder = async (folderId: string) => {
    if (!confirm("Are you sure you want to delete this folder?")) return;

    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        setFolders(folders.filter((f) => f.id !== folderId));
        if (selectedFolder?.id === folderId) {
          setSelectedFolder(null);
        }
      } else {
        console.error("Error deleting folder:", data);
        alert(`Failed to delete folder: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting folder:", error);
      alert("Failed to delete folder");
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

  const handleUploadSuccess = async (result: any) => {
    if (!session?.user?.id) return;

    try {
      const imageData = new FormData();
      imageData.append("filename", result.event.info.original_filename);
      imageData.append("cloudinary_public_id", result.event.info.public_id);
      imageData.append("cloudinary_url", result.event.info.secure_url);
      imageData.append("file_size", result.event.info.bytes);
      imageData.append("user_id", session.user.id);
      if (selectedFolder) {
        imageData.append("folder_id", selectedFolder.id);
      }

      const response = await fetch("/api/images", {
        method: "POST",
        body: imageData,
      });

      if (response.ok) {
        const newImage = await response.json();
        setImages([...images, newImage]);
      }
    } catch (error) {
      console.error("Error saving image record:", error);
      alert("Failed to save image record");
    }
  };

  const handleLocalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !session?.user?.id) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      try {
        // Upload to Cloudinary via our API
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);

        const cloudinaryResponse = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (!cloudinaryResponse.ok) {
          const errorData = await cloudinaryResponse.json();
          throw new Error(errorData.error || "Cloudinary upload failed");
        }

        const cloudinaryData = await cloudinaryResponse.json();

        // Save image record to database
        const imageData = new FormData();
        imageData.append("filename", file.name);
        imageData.append("cloudinary_public_id", cloudinaryData.public_id);
        imageData.append("cloudinary_url", cloudinaryData.secure_url);
        imageData.append("file_size", file.size.toString());
        imageData.append("user_id", session.user.id);
        if (selectedFolder) {
          imageData.append("folder_id", selectedFolder.id);
        }

        const response = await fetch("/api/images", {
          method: "POST",
          body: imageData,
        });

        if (response.ok) {
          const newImage = await response.json();
          setImages([...images, newImage]);
        } else {
          alert(`Failed to save image record for ${file.name}`);
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        alert(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const displayImages = selectedFolder
    ? images.filter((img) => img.folder_id === selectedFolder.id)
    : images.filter((img) => !img.folder_id);

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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-4">
              <h2 className="font-semibold text-gray-900 mb-4">Folders</h2>

              <div className="mb-4 flex gap-2">
                <Input
                  placeholder="New folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && createFolder()}
                  className="text-sm"
                />
                <Button onClick={createFolder} size="sm" className="flex-shrink-0 text-white" style={{ backgroundColor: "#690031" }}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

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
                    <button
                      onClick={() => deleteFolder(folder.id)}
                      className={`p-1 rounded ${
                        selectedFolder?.id === folder.id
                          ? "text-white hover:opacity-80"
                          : "hover:bg-red-100 text-red-600"
                      }`}
                      title="Delete folder"
                    >
                      <Trash2 className="h-3 w-3" />
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

                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleLocalFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="gap-2 text-white"
                    style={{ backgroundColor: "#690031" }}
                  >
                    <Upload className="h-4 w-4" />
                    {uploading ? "Uploading..." : "Upload Image"}
                  </Button>
                </div>
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
      </main>
    </div>
  );
}
