-- 1. Modify the Comment table to support replies and creator hearts
ALTER TABLE public."Comment" 
ADD COLUMN IF NOT EXISTS "parentId" text NULL REFERENCES public."Comment"(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS "creatorLiked" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "upvotes" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "downvotes" integer DEFAULT 0;

-- 2. Create the CommentVote table for user likes and dislikes on individual comments
CREATE TABLE IF NOT EXISTS public."CommentVote" (
  id text NOT NULL,
  type integer NOT NULL, -- 1 for like, -1 for dislike
  "userId" text NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  "commentId" text NOT NULL REFERENCES public."Comment"(id) ON DELETE CASCADE,
  "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommentVote_pkey" PRIMARY KEY (id),
  CONSTRAINT "CommentVote_userId_commentId_key" UNIQUE ("userId", "commentId")
) TABLESPACE pg_default;

-- 3. Create a Postgres Trigger to keep Comment upvotes/downvotes aggregated locally

CREATE OR REPLACE FUNCTION trigger_update_comment_score()
RETURNS TRIGGER AS $$
BEGIN
  -- If we are inserting a new vote
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 1 THEN
      UPDATE public."Comment" SET upvotes = upvotes + 1 WHERE id = NEW."commentId";
    ELSIF NEW.type = -1 THEN
      UPDATE public."Comment" SET downvotes = downvotes + 1 WHERE id = NEW."commentId";
    END IF;
    RETURN NEW;
  -- If we are deleting a vote
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 1 THEN
      UPDATE public."Comment" SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = OLD."commentId";
    ELSIF OLD.type = -1 THEN
      UPDATE public."Comment" SET downvotes = GREATEST(downvotes - 1, 0) WHERE id = OLD."commentId";
    END IF;
    RETURN OLD;
  -- If we are updating a vote
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only do something if the type changed
    IF NEW.type != OLD.type THEN
      -- Decrement old type sum
      IF OLD.type = 1 THEN
        UPDATE public."Comment" SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = OLD."commentId";
      ELSIF OLD.type = -1 THEN
        UPDATE public."Comment" SET downvotes = GREATEST(downvotes - 1, 0) WHERE id = OLD."commentId";
      END IF;
      
      -- Increment new type sum
      IF NEW.type = 1 THEN
        UPDATE public."Comment" SET upvotes = upvotes + 1 WHERE id = NEW."commentId";
      ELSIF NEW.type = -1 THEN
        UPDATE public."Comment" SET downvotes = downvotes + 1 WHERE id = NEW."commentId";
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. Create or replace the trigger explicitly to ensure it runs
DROP TRIGGER IF EXISTS tr_update_score_on_comment_vote ON public."CommentVote";
CREATE TRIGGER tr_update_score_on_comment_vote
AFTER INSERT OR DELETE OR UPDATE ON public."CommentVote"
FOR EACH ROW
EXECUTE FUNCTION trigger_update_comment_score();
