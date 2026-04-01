-- CONTENT SYSTEM UPGRADE MIGRATION
-- Add is_active and custom_category columns to Post and stories tables

-- Update Post table
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS custom_category TEXT NULL;

-- Update stories table (if exists, checking before applying)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stories') THEN
        ALTER TABLE stories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
        ALTER TABLE stories ADD COLUMN IF NOT EXISTS custom_category TEXT NULL;
    END IF;
END $$;

-- Add indices for performance
CREATE INDEX IF NOT EXISTS idx_post_is_active ON "Post"(is_active);
CREATE INDEX IF NOT EXISTS idx_post_category ON "Post"(category);
