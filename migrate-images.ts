import { db } from "./src/db/index";

async function createImagesTable() {
  try {
    console.log("Creating images table...");
    
    // Using raw SQL through the database connection
    await db.execute(`
      CREATE TABLE IF NOT EXISTS images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        cloudinary_public_id VARCHAR(255) UNIQUE NOT NULL,
        cloudinary_url TEXT NOT NULL,
        filename VARCHAR(255) NOT NULL,
        file_size INT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_images_user ON images(user_id);
      CREATE INDEX IF NOT EXISTS idx_images_created ON images(created_at DESC);
    `);

    console.log("✅ Images table created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating images table:", error);
    process.exit(1);
  }
}

createImagesTable();
