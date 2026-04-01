-- PART 1: DATABASE UPDATE

ALTER TABLE public.creator_requests
ADD COLUMN IF NOT EXISTS request_type TEXT DEFAULT 'personal' CHECK (request_type IN ('personal','organization'));

-- PERSONAL CREATOR FIELDS
ALTER TABLE public.creator_requests
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS social_link TEXT;

-- ORGANIZATION FIELDS
ALTER TABLE public.creator_requests
ADD COLUMN IF NOT EXISTS channel_name TEXT,
ADD COLUMN IF NOT EXISTS channel_email TEXT,
ADD COLUMN IF NOT EXISTS category TEXT[],
ADD COLUMN IF NOT EXISTS employee_size INTEGER,
ADD COLUMN IF NOT EXISTS channel_bio TEXT;

-- UNIQUE USERNAME CONSTRAINT
CREATE UNIQUE INDEX IF NOT EXISTS idx_creator_username_unique
ON public.creator_requests(username)
WHERE username IS NOT NULL;
