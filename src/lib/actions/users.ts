"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

type DBUserRole = "ADMIN" | "REVIEWER" | "USER";

export async function createUser(
  email: string,
  password: string,
  name: string,
  role: DBUserRole = "USER"
) {
  try {
    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        name,
        role: role as DBUserRole,
      })
      .returning();

    return newUser[0];
  } catch (error) {
    console.error("Error creating user:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to create user");
  }
}

export async function getUserByEmail(email: string) {
  try {
    return await db.query.users.findFirst({
      where: eq(users.email, email),
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}
