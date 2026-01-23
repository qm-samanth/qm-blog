"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, LayoutDashboard } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-blue-600">
          QM Blog
        </Link>

        <div className="flex items-center gap-4">
          {session?.user ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{session.user.name}</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {session.user.role}
                </span>
              </div>

              {(session.user.role === "ADMIN" || session.user.role === "REVIEWER") && (
                <>
                  {session.user.role === "ADMIN" && (
                    <Link href="/admin">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Settings className="h-4 w-4" />
                        Admin
                      </Button>
                    </Link>
                  )}
                  {session.user.role === "REVIEWER" && (
                    <Link href="/review">
                      <Button variant="outline" size="sm" className="gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        Review Queue
                      </Button>
                    </Link>
                  )}
                </>
              )}

              {session.user.role === "USER" && (
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" className="gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <Link href="/auth/signin">
              <Button>Sign In</Button>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
