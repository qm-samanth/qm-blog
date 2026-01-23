"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";

interface CreateCategoryInput {
  name: string;
  slug: string;
}

interface UpdateCategoryInput {
  name?: string;
  slug?: string;
}

export async function getCategories() {
  try {
    const result = await db.select().from(categories);
    return result;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function getCategoryById(id: number) {
  try {
    const result = await db.query.categories.findFirst({
      where: eq(categories.id, id),
    });
    return result || null;
  } catch (error) {
    console.error("Error fetching category:", error);
    return null;
  }
}

export async function createCategory(input: CreateCategoryInput) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized: Must be logged in");
  }

  if (session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Only admins can create categories");
  }

  try {
    // Check if slug already exists
    const existing = await db.query.categories.findFirst({
      where: eq(categories.slug, input.slug),
    });

    if (existing) {
      throw new Error("A category with this slug already exists");
    }

    // Check if name already exists
    const existingName = await db.query.categories.findFirst({
      where: eq(categories.name, input.name),
    });

    if (existingName) {
      throw new Error("A category with this name already exists");
    }

    const newCategory = await db
      .insert(categories)
      .values({
        name: input.name,
        slug: input.slug,
      })
      .returning();

    return newCategory[0];
  } catch (error) {
    console.error("Error creating category:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to create category");
  }
}

export async function updateCategory(
  id: number,
  input: UpdateCategoryInput
) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized: Must be logged in");
  }

  if (session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Only admins can update categories");
  }

  try {
    const category = await db.query.categories.findFirst({
      where: eq(categories.id, id),
    });

    if (!category) {
      throw new Error("Category not found");
    }

    // Check if new slug already exists (if being changed)
    if (input.slug && input.slug !== category.slug) {
      const existing = await db.query.categories.findFirst({
        where: eq(categories.slug, input.slug),
      });
      if (existing) {
        throw new Error("A category with this slug already exists");
      }
    }

    // Check if new name already exists (if being changed)
    if (input.name && input.name !== category.name) {
      const existingName = await db.query.categories.findFirst({
        where: eq(categories.name, input.name),
      });
      if (existingName) {
        throw new Error("A category with this name already exists");
      }
    }

    const updatedCategory = await db
      .update(categories)
      .set({
        ...(input.name && { name: input.name }),
        ...(input.slug && { slug: input.slug }),
      })
      .where(eq(categories.id, id))
      .returning();

    return updatedCategory[0];
  } catch (error) {
    console.error("Error updating category:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to update category");
  }
}

export async function deleteCategory(id: number) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized: Must be logged in");
  }

  if (session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Only admins can delete categories");
  }

  try {
    const category = await db.query.categories.findFirst({
      where: eq(categories.id, id),
    });

    if (!category) {
      throw new Error("Category not found");
    }

    await db.delete(categories).where(eq(categories.id, id));

    return { success: true };
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to delete category");
  }
}
