-- Migration: Add tags support
-- Tags table and post_tags junction table for many-to-many relationship

-- Create tags table
CREATE TABLE IF NOT EXISTS public.tags
(
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) COLLATE pg_catalog."default" UNIQUE NOT NULL,
    slug VARCHAR(100) COLLATE pg_catalog."default" UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.tags
    OWNER to postgres;

-- Create post_tags junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.post_tags
(
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.post_tags
    OWNER to postgres;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_tags_slug
    ON public.tags USING btree
    (slug ASC NULLS LAST)
    WITH (fillfactor=100, deduplicate_items=True)
    TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_post_tags_post
    ON public.post_tags USING btree
    (post_id ASC NULLS LAST)
    WITH (fillfactor=100, deduplicate_items=True)
    TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_post_tags_tag
    ON public.post_tags USING btree
    (tag_id ASC NULLS LAST)
    WITH (fillfactor=100, deduplicate_items=True)
    TABLESPACE pg_default;
