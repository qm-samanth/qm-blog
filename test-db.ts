import { db } from "./src/db/index.js";
import { users } from "./src/db/schema.js";

async function testConnection() {
  try {
    console.log("🔄 Testing database connection...\n");
    
    // 1. Test connection by counting users
    console.log("1️⃣  Fetching all users...");
    const allUsers = await db.select().from(users);
    console.log(`   ✅ Found ${allUsers.length} users\n`);
    
    // 2. List all users
    if (allUsers.length > 0) {
      console.log("2️⃣  User Details:");
      allUsers.forEach((user, index) => {
        console.log(`   User ${index + 1}:`);
        console.log(`   - ID: ${user.id}`);
        console.log(`   - Email: ${user.email}`);
        console.log(`   - Role: ${user.role}`);
        console.log(`   - Created: ${user.created_at}\n`);
      });
    } else {
      console.log("2️⃣  No users found yet. Run 'npm run seed' to add demo users.\n");
    }
    
    console.log("✅ Database connection is working!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Database connection failed!");
    console.error("Error details:", error);
    process.exit(1);
  }
}

testConnection();
