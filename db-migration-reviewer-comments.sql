-- Migration: Add reviewer_comments column to posts table
-- This allows reviewers to add comments when approving or rejecting posts

ALTER TABLE IF EXISTS public.posts
    ADD COLUMN IF NOT EXISTS reviewer_comments text;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_posts_status_reviewer
    ON public.posts USING btree
    (status ASC NULLS LAST, reviewer_id ASC NULLS LAST)
    WITH (fillfactor=100, deduplicate_items=True)
    TABLESPACE pg_default;
