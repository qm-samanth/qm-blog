"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, LayoutDashboard, Image as ImageIcon, Tag, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <header style={{ backgroundColor: "#690031" }} className="shadow-sm">
      <nav className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <img 
            src="https://qualminds.com/images/QM_logo.png" 
            alt="QM Logo" 
            className="h-4"
          />
        </Link>

        <div className="flex items-center gap-4">
          {/* Social Media Icons */}
          <div className="flex items-center gap-3">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-200 transition">
              <Facebook className="h-4 w-4" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-200 transition">
              <Twitter className="h-4 w-4" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-200 transition">
              <Linkedin className="h-4 w-4" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-200 transition">
              <Instagram className="h-4 w-4" />
            </a>
          </div>

          {/* User Section */}
          {session?.user ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm text-white">{session.user.email}</span>
                <span className="text-xs bg-pink-200 text-purple-900 px-2 py-1 rounded-full">
                  {session.user.role}
                </span>
              </div>

              {(session.user.role === "ADMIN" || session.user.role === "REVIEWER") && (
                <>
                  {session.user.role === "ADMIN" && (
                    <>
                      <Link href="/admin">
                        <Button variant="outline" size="sm" className="gap-2 text-white border-white hover:bg-opacity-90">
                          <Settings className="h-4 w-4" />
                          Admin
                        </Button>
                      </Link>
                      <Link href="/admin/tags">
                        <Button variant="outline" size="sm" className="gap-2 text-white border-white hover:bg-opacity-90">
                          <Tag className="h-4 w-4" />
                          Tags
                        </Button>
                      </Link>
                      <Link href="/review">
                        <Button variant="outline" size="sm" className="gap-2 text-white border-white hover:bg-opacity-90">
                          <LayoutDashboard className="h-4 w-4" />
                          Review Queue
                        </Button>
                      </Link>
                    </>
                  )}
                  {session.user.role === "REVIEWER" && (
                    <Link href="/review">
                      <Button variant="outline" size="sm" className="gap-2 text-white border-white hover:bg-opacity-90">
                        <LayoutDashboard className="h-4 w-4" />
                        Review Queue
                      </Button>
                    </Link>
                  )}
                </>
              )}

              {session.user.role === "USER" && (
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" className="gap-2 text-white border-white hover:bg-opacity-90">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
              )}

              <Link href="/image-manager">
                <Button variant="outline" size="sm" className="gap-2 text-white border-white hover:bg-opacity-90">
                  <ImageIcon className="h-4 w-4" />
                  Images
                </Button>
              </Link>

              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
                className="gap-2 text-white border-white hover:bg-opacity-90"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <Link href="/auth/signin">
              <Button style={{ backgroundColor: "#f5dbc6", color: "#690031" }} className="font-bold hover:opacity-90 rounded-full px-6 py-1 h-auto">Sign In</Button>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
