-- Migration: Add featured_image_url column to posts table
-- This allows storing hero/featured images for posts from Cloudinary URLs

ALTER TABLE IF EXISTS public.posts
    ADD COLUMN IF NOT EXISTS featured_image_url text;

-- Create index on featured_image_url for posts
CREATE INDEX IF NOT EXISTS idx_posts_featured_image
    ON public.posts USING btree
    (featured_image_url ASC NULLS LAST)
    WITH (fillfactor=100, deduplicate_items=True)
    TABLESPACE pg_default;
