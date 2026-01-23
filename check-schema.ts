import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function test() {
  try {
    console.log("🔄 Checking users table structure...\n");
    
    const client = await pool.connect();
    
    // Get table structure
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    console.log("📋 Users table columns:");
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    });
    
    // Get sample data
    console.log("\n📊 Sample data:");
    const dataResult = await client.query("SELECT * FROM users LIMIT 5;");
    console.log(`   Total rows: ${dataResult.rowCount}`);
    if (dataResult.rows.length > 0) {
      console.log(`   First row:`, dataResult.rows[0]);
    }
    
    client.release();
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

test();
