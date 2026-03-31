-- Clean idempotent setup for true, 1-to-1 Post View analytics
create table if not exists public."PostView" (
  id text not null,
  "userId" text not null,
  "postId" text not null,
  "createdAt" timestamp without time zone not null default CURRENT_TIMESTAMP,
  constraint PostView_pkey primary key (id),
  constraint PostView_postId_fkey foreign KEY ("postId") references public."Post" (id) on update CASCADE on delete CASCADE,
  constraint PostView_userId_fkey foreign KEY ("userId") references public."User" (id) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;

-- CRITICAL: Prevent duplicate views at the database engine level (1 User -> 1 Post == Max 1 View Record)
create unique INDEX IF not exists "unique_post_view" on public."PostView" using btree ("userId", "postId") TABLESPACE pg_default;

-- Setup RLS (Matches Supabase conventions used on your other analytics tables)
ALTER TABLE public."PostView" ENABLE ROW LEVEL SECURITY;

drop policy if exists "Enable read access for all users" on public."PostView";
CREATE POLICY "Enable read access for all users" ON public."PostView" 
FOR SELECT USING (true);

drop policy if exists "Enable insert for authenticated users" on public."PostView";
CREATE POLICY "Enable insert for authenticated users" ON public."PostView" 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');
