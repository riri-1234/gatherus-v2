-- Fix broken RLS policies for rsvps table
DROP POLICY IF EXISTS "Users can create their own RSVP" ON rsvps;
DROP POLICY IF EXISTS "Users can update their own RSVP" ON rsvps;
DROP POLICY IF EXISTS "Users can delete their own RSVP" ON rsvps;

CREATE POLICY "Users can create their own RSVP" ON rsvps FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = rsvps.user_id AND profiles.user_id = auth.uid())
);

CREATE POLICY "Users can update their own RSVP" ON rsvps FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = rsvps.user_id AND profiles.user_id = auth.uid())
);

CREATE POLICY "Users can delete their own RSVP" ON rsvps FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = rsvps.user_id AND profiles.user_id = auth.uid())
);

-- Fix broken RLS policies for event_swipes table
DROP POLICY IF EXISTS "Users can create their own swipes" ON event_swipes;
DROP POLICY IF EXISTS "Users can view their own swipes" ON event_swipes;

CREATE POLICY "Users can create their own swipes" ON event_swipes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = event_swipes.user_id AND profiles.user_id = auth.uid())
);

CREATE POLICY "Users can view their own swipes" ON event_swipes FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = event_swipes.user_id AND profiles.user_id = auth.uid())
);

-- Fix broken RLS policies for event_ratings table
DROP POLICY IF EXISTS "Users can create their own ratings" ON event_ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON event_ratings;

CREATE POLICY "Users can create their own ratings" ON event_ratings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = event_ratings.user_id AND profiles.user_id = auth.uid())
);

CREATE POLICY "Users can update their own ratings" ON event_ratings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = event_ratings.user_id AND profiles.user_id = auth.uid())
);