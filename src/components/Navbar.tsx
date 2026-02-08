"use client";

import { useSession, signOut, signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, LayoutDashboard, Image as ImageIcon, Tag, Facebook, Twitter, Linkedin, Instagram, Lock, ChevronDown, Plus, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInError, setSignInError] = useState("");
  const [signInLoading, setSignInLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError("");
    setSignInLoading(true);

    try {
      const result = await signIn("credentials", {
        email: signInEmail,
        password: signInPassword,
        redirect: false,
      });

      if (result?.error) {
        setSignInError(result.error || "Invalid email or password");
      } else {
        setSignInModalOpen(false);
        setSignInEmail("");
        setSignInPassword("");
        router.push("/");
      }
    } catch (err) {
      setSignInError("An error occurred. Please try again.");
    } finally {
      setSignInLoading(false);
    }
  };

  const firstName = (session?.user as any)?.firstName;
  const lastName = (session?.user as any)?.lastName;

  return (
    <header style={{ backgroundColor: "#690031" }} className="shadow-sm">
      <nav className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div></div>

        <div className="flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img 
              src="https://qualminds.com/images/QM_logo.png" 
              alt="QM Logo" 
              className="h-4"
            />
          </Link>

          {/* Social Media Icons */}
          <div className="flex items-center gap-2">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-sm hover:opacity-70 transition" style={{ backgroundColor: "#f5dbc6", color: "#690031" }}>
              <Facebook className="h-4 w-4" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-sm hover:opacity-70 transition" style={{ backgroundColor: "#f5dbc6", color: "#690031" }}>
              <Twitter className="h-4 w-4" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-sm hover:opacity-70 transition" style={{ backgroundColor: "#f5dbc6", color: "#690031" }}>
              <Linkedin className="h-4 w-4" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-sm hover:opacity-70 transition" style={{ backgroundColor: "#f5dbc6", color: "#690031" }}>
              <Instagram className="h-4 w-4" />
            </a>
          </div>

          {/* Create Post Button - Only for logged in users */}
          {session?.user && session.user.role === "USER" && (
            <Link href="/posts/create">
              <Button 
                style={{ backgroundColor: "#f5dbc6", color: "#690031" }} 
                className="font-bold hover:opacity-90 px-3 py-1 rounded-sm h-9 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Post
              </Button>
            </Link>
          )}

          {/* User Section */}
          {session?.user ? (
            <div className="relative" ref={dropdownRef}>
              {/* Email with Dropdown Toggle */}
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 text-sm text-white hover:opacity-80 transition"
              >
                <span>{session.user.email}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg z-50 py-2">
                  {/* Greeting */}
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-gray-900 font-semibold text-sm">
                      Hello {firstName && lastName ? `${firstName} ${lastName}` : session.user.email}
                    </p>
                    <p className="text-xs text-gray-600">{session.user.role}</p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    {/* Role-Specific Links - Dashboard First */}
                    {session.user.role === "USER" && (
                      <Link href="/dashboard">
                        <button
                          onClick={() => setDropdownOpen(false)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 flex items-center gap-3"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          Dashboard
                        </button>
                      </Link>
                    )}

                    {session.user.role === "REVIEWER" && (
                      <Link href="/review">
                        <button
                          onClick={() => setDropdownOpen(false)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 flex items-center gap-3"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          Review Queue
                        </button>
                      </Link>
                    )}

                    {session.user.role === "ADMIN" && (
                      <Link href="/admin">
                        <button
                          onClick={() => setDropdownOpen(false)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 flex items-center gap-3"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          Dashboard
                        </button>
                      </Link>
                    )}

                    {/* Images Link */}
                    <Link href="/image-manager">
                      <button
                        onClick={() => setDropdownOpen(false)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 flex items-center gap-3"
                      >
                        <ImageIcon className="h-4 w-4" />
                        Images
                      </button>
                    </Link>

                    {/* Settings Link */}
                    <Link href="/settings">
                      <button
                        onClick={() => setDropdownOpen(false)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 flex items-center gap-3"
                      >
                        <Lock className="h-4 w-4" />
                        Settings
                      </button>
                    </Link>

                    {/* Sign Out Link */}
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        signOut();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 border-t border-gray-200 mt-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setSignInModalOpen(true)}
              style={{ backgroundColor: "#f5dbc6", color: "#690031" }}
              className="font-bold hover:opacity-90 px-4 py-1 rounded-sm h-9"
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Sign In Modal */}
      {signInModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full relative overflow-hidden">
            {/* Close Button */}
            <button
              onClick={() => {
                setSignInModalOpen(false);
                setSignInError("");
                setSignInEmail("");
                setSignInPassword("");
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition z-10"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Form Section */}
            <div className="p-8 space-y-6">
              {/* Title and Subtitle */}
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back!</h2>
                <p className="text-sm text-gray-600">Enter account details to log in</p>
              </div>

              {signInError && (
                <div className="p-3 rounded text-sm" style={{ backgroundColor: "#f0e6eb", color: "#690031", border: "1px solid #690031" }}>
                  {signInError}
                </div>
              )}

              <form onSubmit={handleSignIn} className="space-y-5">
                <div>
                  <input
                    id="modal-email"
                    type="email"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    required
                    autoComplete="off"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-0 focus:border-transparent text-sm placeholder-gray-500"
                    style={{ focusRingColor: "#690031" }}
                    placeholder="example@email.com"
                  />
                </div>

                <div>
                  <input
                    id="modal-password"
                    type="password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                    autoComplete="off"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-0 focus:border-transparent text-sm placeholder-gray-500"
                    style={{ focusRingColor: "#690031" }}
                    placeholder="••••••••"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={signInLoading}
                  className="w-full text-white mt-6"
                  style={{ backgroundColor: "#690031" }}
                >
                  {signInLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              {/* Demo Credentials */}
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
        </div>
      )}
    </header>
  );
}
