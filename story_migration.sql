-- Story System Migration

-- 1. Add feature flags to existing stories table
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS allow_comments BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_sharing BOOLEAN DEFAULT true;

-- 2. Create Comments Table
CREATE TABLE IF NOT EXISTS public.story_comments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id TEXT NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Create Messages Table
CREATE TABLE IF NOT EXISTS public.story_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id TEXT NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  creator_id TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Create Shares Table
CREATE TABLE IF NOT EXISTS public.story_shares (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id TEXT NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Performance Index for Views
CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON public.story_views(story_id);

-- Optional: Enable RLS on new tables and expose them in public API
ALTER TABLE public.story_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.story_comments;
CREATE POLICY "Enable read access for all users" ON public.story_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.story_comments;
CREATE POLICY "Enable insert for authenticated users" ON public.story_comments FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Enable read access for all users" ON public.story_messages;
CREATE POLICY "Enable read access for all users" ON public.story_messages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.story_messages;
CREATE POLICY "Enable insert for authenticated users" ON public.story_messages FOR INSERT WITH CHECK (auth.uid()::text = sender_id);

DROP POLICY IF EXISTS "Enable read access for all users" ON public.story_shares;
CREATE POLICY "Enable read access for all users" ON public.story_shares FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.story_shares;
CREATE POLICY "Enable insert for authenticated users" ON public.story_shares FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- 6. Clean up existing duplicate data before enforcing bounds
DELETE FROM public.story_views
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY story_id, user_id ORDER BY viewed_at ASC, id ASC) AS row_num
        FROM public.story_views
    ) t WHERE t.row_num > 1
);

DELETE FROM public.story_likes
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY story_id, user_id ORDER BY liked_at ASC, id ASC) AS row_num
        FROM public.story_likes
    ) t WHERE t.row_num > 1
);

DELETE FROM public.story_shares
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY story_id, user_id ORDER BY shared_at ASC, id ASC) AS row_num
        FROM public.story_shares
    ) t WHERE t.row_num > 1
);

-- 7. UNIQUE Constraints (Instagram-like strict duplicate prevention)
-- Automatically add constraints onto clean data
ALTER TABLE public.story_views DROP CONSTRAINT IF EXISTS unique_story_view;
ALTER TABLE public.story_views Add CONSTRAINT unique_story_view UNIQUE (story_id, user_id);

ALTER TABLE public.story_likes DROP CONSTRAINT IF EXISTS unique_story_like;
ALTER TABLE public.story_likes Add CONSTRAINT unique_story_like UNIQUE (story_id, user_id);

ALTER TABLE public.story_shares DROP CONSTRAINT IF EXISTS unique_story_share;
ALTER TABLE public.story_shares Add CONSTRAINT unique_story_share UNIQUE (story_id, user_id);
