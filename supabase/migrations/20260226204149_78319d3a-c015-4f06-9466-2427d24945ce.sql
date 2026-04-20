
-- Drop the overly permissive select policy on event_ratings
DROP POLICY IF EXISTS "Ratings viewable by authenticated users" ON public.event_ratings;

-- Only the event host can view ratings for their events
CREATE POLICY "Host can view ratings for their events"
ON public.event_ratings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_ratings.event_id
      AND public.is_event_host(events.host_id)
  )
);

-- Users can also view their own ratings
CREATE POLICY "Users can view own ratings"
ON public.event_ratings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = event_ratings.user_id
      AND profiles.user_id = auth.uid()
  )
);
