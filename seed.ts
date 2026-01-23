import { db } from "./src/db/index";
import { users, categories } from "./src/db/schema";
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
          email: "admin@example.com",
          password_hash: adminPassword,
          role: "ADMIN",
          created_at: new Date(),
        },
        {
          email: "reviewer@example.com",
          password_hash: reviewerPassword,
          role: "REVIEWER",
          created_at: new Date(),
        },
        {
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
