import { db } from "@/db";
import { categories } from "@/db/schema";

export async function GET() {
  try {
    const result = await db.select().from(categories).orderBy(categories.name);
    
    return Response.json(result);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return Response.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
