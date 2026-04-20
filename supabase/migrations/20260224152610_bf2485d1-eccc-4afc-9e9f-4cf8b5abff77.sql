
CREATE OR REPLACE FUNCTION public.calculate_match_percentage(profile_a uuid, profile_b uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH
  -- Events both users have RSVP'd to (confirmed)
  shared_events AS (
    SELECT DISTINCT r1.event_id
    FROM rsvps r1
    JOIN rsvps r2 ON r1.event_id = r2.event_id
    WHERE r1.user_id = profile_a
      AND r2.user_id = profile_b
      AND r1.status = 'confirmed'
      AND r2.status = 'confirmed'
  ),
  -- All unique events either user attended
  all_events AS (
    SELECT DISTINCT event_id FROM rsvps
    WHERE user_id IN (profile_a, profile_b)
      AND status = 'confirmed'
  ),
  -- Hosts both users have attended events from
  shared_hosts AS (
    SELECT DISTINCT e.host_id
    FROM rsvps r1
    JOIN rsvps r2 ON r1.event_id = r2.event_id
    JOIN events e ON e.id = r1.event_id
    WHERE r1.user_id = profile_a
      AND r2.user_id = profile_b
      AND r1.status = 'confirmed'
      AND r2.status = 'confirmed'
  ),
  -- All unique hosts either user attended events from
  all_hosts AS (
    SELECT DISTINCT e.host_id
    FROM rsvps r
    JOIN events e ON e.id = r.event_id
    WHERE r.user_id IN (profile_a, profile_b)
      AND r.status = 'confirmed'
  ),
  scores AS (
    SELECT
      CASE WHEN (SELECT COUNT(*) FROM all_events) = 0 THEN 0
           ELSE ROUND((SELECT COUNT(*) FROM shared_events)::numeric / (SELECT COUNT(*) FROM all_events) * 100)
      END AS event_score,
      CASE WHEN (SELECT COUNT(*) FROM all_hosts) = 0 THEN 0
           ELSE ROUND((SELECT COUNT(*) FROM shared_hosts)::numeric / (SELECT COUNT(*) FROM all_hosts) * 100)
      END AS host_score
  )
  SELECT LEAST(100, ROUND((event_score * 0.6 + host_score * 0.4))::integer)
  FROM scores;
$$;
