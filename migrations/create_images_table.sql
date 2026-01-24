-- Create images table for Cloudinary image management
CREATE TABLE images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cloudinary_public_id VARCHAR(255) UNIQUE NOT NULL,
    cloudinary_url TEXT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_size INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster queries by user
CREATE INDEX idx_images_user ON images(user_id);
CREATE INDEX idx_images_created ON images(created_at DESC);
