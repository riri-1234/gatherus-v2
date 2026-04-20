
-- Length constraints on events table
ALTER TABLE events
  ADD CONSTRAINT events_title_length CHECK (char_length(title) > 0 AND char_length(title) <= 200),
  ADD CONSTRAINT events_description_length CHECK (description IS NULL OR char_length(description) <= 5000),
  ADD CONSTRAINT events_location_length CHECK (char_length(location) > 0 AND char_length(location) <= 200),
  ADD CONSTRAINT events_location_details_length CHECK (location_details IS NULL OR char_length(location_details) <= 500),
  ADD CONSTRAINT events_event_rules_length CHECK (event_rules IS NULL OR char_length(event_rules) <= 2000),
  ADD CONSTRAINT events_capacity_range CHECK (capacity IS NULL OR (capacity > 0 AND capacity <= 10000));

-- Length constraints on profiles table
ALTER TABLE profiles
  ADD CONSTRAINT profiles_name_length CHECK (name IS NULL OR char_length(name) <= 100),
  ADD CONSTRAINT profiles_nickname_length CHECK (nickname IS NULL OR char_length(nickname) <= 50),
  ADD CONSTRAINT profiles_bio_length CHECK (bio IS NULL OR char_length(bio) <= 500),
  ADD CONSTRAINT profiles_program_length CHECK (program IS NULL OR char_length(program) <= 200),
  ADD CONSTRAINT profiles_location_length CHECK (location IS NULL OR char_length(location) <= 200),
  ADD CONSTRAINT profiles_phone_length CHECK (phone_number IS NULL OR char_length(phone_number) <= 20),
  ADD CONSTRAINT profiles_instagram_length CHECK (instagram_handle IS NULL OR char_length(instagram_handle) <= 30);

-- Length constraint on event_ratings
ALTER TABLE event_ratings
  ADD CONSTRAINT ratings_comment_length CHECK (comment IS NULL OR char_length(comment) <= 1000);

-- Tighten RSVP SELECT policy: only own RSVPs, event hosts, or co-attendees
DROP POLICY IF EXISTS "Authenticated users can view RSVPs" ON rsvps;

CREATE POLICY "View own RSVPs or as event host" ON rsvps
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = rsvps.user_id AND profiles.user_id = auth.uid())
      OR
      EXISTS (SELECT 1 FROM events e JOIN profiles p ON e.host_id = p.id WHERE e.id = rsvps.event_id AND p.user_id = auth.uid())
      OR
      EXISTS (SELECT 1 FROM rsvps r2 JOIN profiles p ON r2.user_id = p.id WHERE r2.event_id = rsvps.event_id AND p.user_id = auth.uid())
    )
  );
