import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { AdminTagsClient } from "@/components/AdminTagsClient";

export default async function AdminTagsPage() {
  const session = await auth();

  // Redirect if not admin
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Tags</h1>
          <p className="text-gray-600 mb-8">Create, edit, and delete blog tags</p>

          <AdminTagsClient />
        </div>
      </main>
    </div>
  );
}
