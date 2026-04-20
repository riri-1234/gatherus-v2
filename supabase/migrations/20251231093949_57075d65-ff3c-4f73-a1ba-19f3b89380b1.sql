-- Fix PUBLIC_DATA_EXPOSURE: RSVPs should require authentication to view
DROP POLICY IF EXISTS "Users can view RSVPs for events" ON rsvps;

-- Require authentication to view RSVPs (prevents anonymous mass data collection)
CREATE POLICY "Authenticated users can view RSVPs" ON rsvps 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);