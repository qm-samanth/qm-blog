import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { firstName, lastName } = await request.json();

    // Validate inputs
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      );
    }

    // Trim whitespace and validate length
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (trimmedFirstName.length === 0 || trimmedLastName.length === 0) {
      return NextResponse.json(
        { error: "Names cannot be empty" },
        { status: 400 }
      );
    }

    if (trimmedFirstName.length > 100 || trimmedLastName.length > 100) {
      return NextResponse.json(
        { error: "Names must be less than 100 characters" },
        { status: 400 }
      );
    }

    // Update user in database
    await db
      .update(users)
      .set({
        first_name: trimmedFirstName,
        last_name: trimmedLastName,
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json(
      { success: true, message: "Profile updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
