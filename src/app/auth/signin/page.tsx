"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error || "Invalid email or password");
      } else {
        router.push("/");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#fbf7f4" }}>
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-md bg-white rounded-lg shadow-2xl overflow-hidden">
          {/* Form Section */}
          <div className="p-8 space-y-6">
            {/* Title and Subtitle */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back!</h2>
              <p className="text-sm text-gray-600">Enter account details to log in</p>
            </div>

            {/* Error Message */}
            {error && (
              <div 
                className="p-3 rounded text-sm"
                style={{ backgroundColor: "#f0e6eb", color: "#690031", border: "1px solid #690031" }}
              >
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="off"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-0 focus:border-transparent text-sm placeholder-gray-500"
                  style={{ outline: "none" }}
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="off"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-0 focus:border-transparent text-sm placeholder-gray-500"
                  style={{ outline: "none" }}
                  placeholder="••••••••"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full text-white mt-6"
                style={{ backgroundColor: "#690031" }}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            {/* Divider */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-600 mb-3">Demo Credentials:</p>
              <div className="text-xs space-y-2 text-gray-600">
                <p><strong>Admin:</strong> admin@example.com / admin123</p>
                <p><strong>Reviewer:</strong> reviewer@example.com / reviewer123</p>
                <p><strong>User:</strong> user@example.com / user123</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
