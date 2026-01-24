-- Migration: Add folders table and folder_id to images
-- This migration adds folder support to the image manager

-- Create folders table
CREATE TABLE IF NOT EXISTS public.folders
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT folders_pkey PRIMARY KEY (id),
    CONSTRAINT folders_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.folders
    OWNER to postgres;

-- Create index on user_id for folders
CREATE INDEX IF NOT EXISTS idx_folders_user
    ON public.folders USING btree
    (user_id ASC NULLS LAST)
    WITH (fillfactor=100, deduplicate_items=True)
    TABLESPACE pg_default;

-- Create index on created_at for folders
CREATE INDEX IF NOT EXISTS idx_folders_created
    ON public.folders USING btree
    (created_at DESC NULLS FIRST)
    WITH (fillfactor=100, deduplicate_items=True)
    TABLESPACE pg_default;

-- Add folder_id column to images table if it doesn't exist
ALTER TABLE IF EXISTS public.images
    ADD COLUMN IF NOT EXISTS folder_id uuid;

-- Add foreign key constraint for folder_id
ALTER TABLE IF EXISTS public.images
    ADD CONSTRAINT images_folder_id_fkey FOREIGN KEY (folder_id)
        REFERENCES public.folders (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE;

-- Create index on folder_id for images
CREATE INDEX IF NOT EXISTS idx_images_folder
    ON public.images USING btree
    (folder_id ASC NULLS LAST)
    WITH (fillfactor=100, deduplicate_items=True)
    TABLESPACE pg_default;
