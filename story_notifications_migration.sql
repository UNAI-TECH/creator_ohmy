-- Enable UUID if not already (standard in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create the trigger function
CREATE OR REPLACE FUNCTION trigger_notify_followers_on_story()
RETURNS TRIGGER AS $$
DECLARE
    creator_name text;
BEGIN
    -- Look up the actual username of the creator
    SELECT username INTO creator_name 
    FROM public."User" 
    WHERE id = NEW.creator_id;
    
    IF creator_name IS NULL THEN
        creator_name := 'A creator you follow';
    END IF;

    -- Insert a Notification object for every single user that follows the creator_id
    INSERT INTO public."Notification" (id, "userId", type, title, message, "targetId", "createdAt", "isRead")
    SELECT 
        uuid_generate_v4()::text,
        "followerId",
        'STORY',
        creator_name || ' posted a new story', -- Places the username as the first word so the App Avatar parser succeeds perfectly!
        'Tap to view their latest update',
        NEW.creator_id,
        NEW.created_at,
        FALSE
    FROM public."Follow"
    WHERE "followingId" = NEW.creator_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Bind the trigger to the stories table
DROP TRIGGER IF EXISTS tr_notify_on_story_insert ON public.stories;

CREATE TRIGGER tr_notify_on_story_insert
AFTER INSERT ON public.stories
FOR EACH ROW
EXECUTE FUNCTION trigger_notify_followers_on_story();
