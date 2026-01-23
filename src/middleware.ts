import { auth } from "@/auth";
import { type NextRequest, NextResponse } from "next/server";
import type { UserRole } from "@/types";

export const runtime = "nodejs";

// Define which roles can access which routes
const routePermissions: Record<string, UserRole[]> = {
  "/admin": ["ADMIN"],
  "/admin/*": ["ADMIN"],
  "/review": ["REVIEWER", "ADMIN"],
  "/review/*": ["REVIEWER", "ADMIN"],
  "/dashboard": ["USER", "REVIEWER", "ADMIN"],
  "/dashboard/*": ["USER", "REVIEWER", "ADMIN"],
  "/api/admin": ["ADMIN"],
  "/api/admin/*": ["ADMIN"],
  "/api/review": ["REVIEWER", "ADMIN"],
  "/api/review/*": ["REVIEWER", "ADMIN"],
  "/api/posts": ["USER", "REVIEWER", "ADMIN"],
};

export async function middleware(request: NextRequest) {
  const session = await auth();
  const pathname = request.nextUrl.pathname;

  // Check if route requires authentication
  const requiresAuth = Object.keys(routePermissions).some((route) => {
    const pattern = route.replace("*", ".*");
    return new RegExp(`^${pattern}$`).test(pathname);
  });

  // If route requires auth and user is not logged in
  if (requiresAuth && !session) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  // If user is logged in, check role permissions
  if (session) {
    const userRole = session.user.role;

    for (const [route, allowedRoles] of Object.entries(routePermissions)) {
      const pattern = route.replace("*", ".*");
      if (new RegExp(`^${pattern}$`).test(pathname)) {
        if (!allowedRoles.includes(userRole as UserRole)) {
          return NextResponse.redirect(new URL("/unauthorized", request.url));
        }
        break;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
