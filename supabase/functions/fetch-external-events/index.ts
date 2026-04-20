const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ExternalEvent {
  id: string;
  title: string;
  date_time: string;
  location: string;
  cover_image_url: string | null;
  url: string;
  source: 'eventbrite';
  category: string;
  current_attendees: number;
}

async function fetchEventbriteEvents(): Promise<ExternalEvent[]> {
  const EVENTBRITE_API_KEY = Deno.env.get('EVENTBRITE_API_KEY');
  if (!EVENTBRITE_API_KEY) {
    console.warn('EVENTBRITE_API_KEY not configured, skipping Eventbrite events');
    return [];
  }

  try {
    const now = new Date().toISOString();
    const url = new URL('https://www.eventbriteapi.com/v3/events/search/');
    url.searchParams.set('start_date.range_start', now);
    url.searchParams.set('expand', 'venue,logo');
    url.searchParams.set('page_size', '50');
    url.searchParams.set('sort_by', 'date');
    // Filter to University of Toronto events
    url.searchParams.set('q', 'University of Toronto');
    url.searchParams.set('location.address', 'Toronto, ON, Canada');
    url.searchParams.set('location.within', '15km');

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${EVENTBRITE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`Eventbrite API error [${response.status}]: ${body}`);
      return [];
    }

    const data = await response.json();
    const events = data?.events || [];

    const categoryMap: Record<string, string> = {
      '103': 'networking',
      '110': 'food_exploration',
      '108': 'sports',
      '105': 'networking',
      '107': 'creative_workshop',
      '101': 'networking',
      '113': 'networking',
      '104': 'party',
      '109': 'outdoor_activity',
      '111': 'culture',
      '112': 'lecture',
      '115': 'networking',
      '116': 'cafe_gathering',
      '117': 'sports',
      '118': 'creative_workshop',
      '119': 'networking',
    };

    return events.map((event: any) => ({
      id: `eventbrite-${event.id}`,
      title: event.name?.text || 'Untitled Event',
      date_time: event.start?.utc || new Date().toISOString(),
      location: event.venue?.address?.localized_address_display || event.venue?.name || 'Online',
      cover_image_url: event.logo?.url || null,
      url: event.url || 'https://eventbrite.com',
      source: 'eventbrite' as const,
      category: categoryMap[event.category_id] || 'networking',
      current_attendees: 0,
    }));
  } catch (error) {
    console.error('Error fetching Eventbrite events:', error);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const events = await fetchEventbriteEvents();

    const sorted = events.sort(
      (a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
    );

    return new Response(
      JSON.stringify({ events: sorted }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-external-events:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message, events: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
