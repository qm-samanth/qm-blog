import { Pool } from "pg";

const pool = new Pool({
  connectionString: "postgresql://postgres:9966888345@localhost:5432/postgres",
});

async function createDatabase() {
  try {
    console.log("🔄 Creating database 'qm_blog'...\n");
    
    const client = await pool.connect();
    
    // Check if database exists
    const checkResult = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'qm_blog';"
    );
    
    if (checkResult.rows.length > 0) {
      console.log("✅ Database 'qm_blog' already exists!");
    } else {
      // Create database
      await client.query("CREATE DATABASE qm_blog;");
      console.log("✅ Database 'qm_blog' created successfully!");
    }
    
    client.release();
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

createDatabase();
