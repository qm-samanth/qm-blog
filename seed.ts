import { db } from "./src/db/index";
import { users, categories } from "./src/db/schema";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

async function seed() {
  try {
    console.log("🌱 Starting database seed...");

    // Create users
    const adminPassword = await bcrypt.hash("admin123", 10);
    const reviewerPassword = await bcrypt.hash("reviewer123", 10);
    const userPassword = await bcrypt.hash("user123", 10);

    const createdUsers = await db
      .insert(users)
      .values([
        {
          id: uuidv4(),
          email: "admin@example.com",
          password_hash: adminPassword,
          role: "ADMIN",
          created_at: new Date(),
        },
        {
          id: uuidv4(),
          email: "reviewer@example.com",
          password_hash: reviewerPassword,
          role: "REVIEWER",
          created_at: new Date(),
        },
        {
          id: uuidv4(),
          email: "user@example.com",
          password_hash: userPassword,
          role: "USER",
          created_at: new Date(),
        },
      ])
      .returning();

    console.log(`✅ Created ${createdUsers.length} users`);
    createdUsers.forEach((u) => {
      console.log(`   - ${u.email} (${u.role})`);
    });

    console.log("\n🎉 Database seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
