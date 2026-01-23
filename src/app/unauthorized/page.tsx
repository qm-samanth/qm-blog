import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Access Denied
        </h1>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page. Your current role
          doesn't allow you to view this content.
        </p>
        <Link href="/">
          <Button>Go Back Home</Button>
        </Link>
      </div>
    </div>
  );
}
