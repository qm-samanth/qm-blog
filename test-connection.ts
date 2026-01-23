import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function test() {
  try {
    console.log("🔄 Testing raw PostgreSQL connection...\n");
    console.log(`📍 Connection URL: ${process.env.DATABASE_URL}\n`);
    
    const client = await pool.connect();
    
    // Get current database
    const dbResult = await client.query("SELECT current_database();");
    console.log(`✅ Connected to database: ${dbResult.rows[0].current_database}\n`);
    
    // List all schemas
    const schemasResult = await client.query(
      "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT LIKE 'pg_%' AND schema_name != 'information_schema';"
    );
    console.log("📦 Available schemas:");
    schemasResult.rows.forEach(row => console.log(`   - ${row.schema_name}`));
    
    // List all tables in public schema
    const tablesResult = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
    );
    console.log("\n📋 Tables in public schema:");
    if (tablesResult.rows.length === 0) {
      console.log("   (none - tables not created yet)");
    } else {
      tablesResult.rows.forEach(row => console.log(`   - ${row.table_name}`));
    }
    
    client.release();
    process.exit(0);
  } catch (error) {
    console.error("❌ Connection failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

test();
