-- Add new event categories
ALTER TYPE event_category ADD VALUE IF NOT EXISTS 'outdoor_activity';
ALTER TYPE event_category ADD VALUE IF NOT EXISTS 'culture';
ALTER TYPE event_category ADD VALUE IF NOT EXISTS 'exchange_community';
ALTER TYPE event_category ADD VALUE IF NOT EXISTS 'speed_dating';

-- Add phone_number to profiles for friend discovery and 2FA
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number text;

-- Add is_public column for profile privacy
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true;

-- Create user_follows table for following system
CREATE TABLE IF NOT EXISTS public.user_follows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable RLS on user_follows
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Users can see who they follow and who follows them
CREATE POLICY "Users can view their own follows"
  ON public.user_follows
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = user_follows.follower_id AND profiles.user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = user_follows.following_id AND profiles.user_id = auth.uid())
  );

-- Users can follow others
CREATE POLICY "Users can follow others"
  ON public.user_follows
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = user_follows.follower_id AND profiles.user_id = auth.uid())
  );

-- Users can unfollow
CREATE POLICY "Users can unfollow"
  ON public.user_follows
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = user_follows.follower_id AND profiles.user_id = auth.uid())
  );

-- Add is_trending, tags columns to events for enhanced feed
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_trending boolean DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Enable realtime for follows
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_follows;