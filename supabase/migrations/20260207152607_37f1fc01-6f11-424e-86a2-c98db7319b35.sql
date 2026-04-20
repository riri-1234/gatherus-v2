
-- Helper function: get current user's profile id (avoids recursion)
CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- Helper function: check if target profile has a follow relationship with current user
CREATE OR REPLACE FUNCTION public.is_follow_related(target_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_follows
    WHERE (follower_id = public.get_my_profile_id() AND following_id = target_profile_id)
       OR (following_id = public.get_my_profile_id() AND follower_id = target_profile_id)
  )
$$;

-- Helper function: check if profile is an event host
CREATE OR REPLACE FUNCTION public.is_event_host(profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events WHERE host_id = profile_id
  )
$$;

-- ========== FIX 1: Restrict profiles SELECT ==========
-- Drop the open policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Users can always view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated users can view event host profiles
CREATE POLICY "View event host profiles" ON public.profiles
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND public.is_event_host(id)
  );

-- Authenticated users can view profiles of people they follow or who follow them
CREATE POLICY "View follow-related profiles" ON public.profiles
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND public.is_follow_related(id)
  );

-- ========== FIX 2: Restrict events to authenticated users ==========
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;

CREATE POLICY "Events viewable by authenticated users" ON public.events
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ========== FIX 3: Restrict event_ratings to authenticated users ==========
DROP POLICY IF EXISTS "Ratings are viewable by everyone" ON public.event_ratings;

CREATE POLICY "Ratings viewable by authenticated users" ON public.event_ratings
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
