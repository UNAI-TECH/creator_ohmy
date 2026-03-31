-- 1. Create the Vote table matching your Prisma schema design
CREATE TABLE IF NOT EXISTS public."Vote" (
  id text not null,
  type integer not null,
  "userId" text not null,
  "postId" text not null,
  "createdAt" timestamp without time zone not null default CURRENT_TIMESTAMP,
  constraint Vote_pkey primary key (id),
  constraint Vote_postId_fkey foreign KEY ("postId") references public."Post" (id) on update CASCADE on delete RESTRICT,
  constraint Vote_userId_fkey foreign KEY ("userId") references public."User" (id) on update CASCADE on delete RESTRICT
) TABLESPACE pg_default;

-- 2. Restrict to 1 Vote per User per Post natively
CREATE UNIQUE INDEX IF NOT EXISTS "Vote_userId_postId_key" ON public."Vote" USING btree ("userId", "postId") TABLESPACE pg_default;

-- 3. Set up RLS Permissions to allow the App to safely access it
ALTER TABLE public."Vote" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public."Vote";
CREATE POLICY "Enable read access for all users" ON public."Vote" 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public."Vote";
CREATE POLICY "Enable all access for authenticated users" ON public."Vote" 
FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 4. Create the core Arithmetic Function to power the Trending Engine
-- Because "type" is explicitly 1 (Like) and -1 (Dislike), we can simply SUM() the types!
CREATE OR REPLACE FUNCTION public.trigger_update_post_score()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_post_id text;
  v_score double precision;
BEGIN
  -- Detect which Post was targeted depending on if it was an insert/update vs a delete
  IF TG_OP = 'DELETE' THEN
    v_post_id := OLD."postId";
  ELSE
    v_post_id := NEW."postId";
  END IF;

  -- Run the calculation natively over the table instantly
  SELECT COALESCE(SUM(type), 0)
  INTO v_score
  FROM public."Vote"
  WHERE "postId" = v_post_id;

  -- Apply the new Trending Score logic directly into the Post table so the Mobile App picks it up
  UPDATE public."Post"
  SET trending_score = v_score
  WHERE id = v_post_id;

  RETURN NULL; -- AFTER triggers ignore the return value
END;
$$;

-- 5. Attach the trigger mechanism
DROP TRIGGER IF EXISTS tr_update_score_on_vote ON public."Vote";
CREATE TRIGGER tr_update_score_on_vote
AFTER INSERT OR UPDATE OR DELETE ON public."Vote"
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_post_score();
