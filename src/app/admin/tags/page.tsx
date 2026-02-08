import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { AdminTagsClient } from "@/components/AdminTagsClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function AdminTagsPage() {
  const session = await auth();

  // Redirect if not admin
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
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
          <h1 className="text-3xl font-bold mb-2 pb-4 border-b-2" style={{ color: "#690031", borderBottomColor: "#690031" }}>Manage Tags</h1>
          <p className="text-gray-600 mb-8 mt-4">Create, edit, and delete blog tags</p>

          <AdminTagsClient />
        </div>
      </main>
    </div>
  );
}
