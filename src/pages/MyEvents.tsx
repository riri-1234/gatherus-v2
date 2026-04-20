import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Users, ChevronRight, Clock, Bell, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { CATEGORY_CONFIG } from '@/lib/constants';

interface EventWithDetails {
  id: string;
  title: string;
  category: string;
  date_time: string;
  location: string;
  current_attendees: number;
  cover_image_url: string | null;
}

interface RSVPWithEvent {
  id: string;
  status: string;
  event: EventWithDetails;
}

interface AttendeeInfo {
  id: string;
  status: string;
  profile: {
    id: string;
    name: string | null;
    nickname: string | null;
    program: string | null;
    avatar_url: string | null;
    instagram_handle: string | null;
  };
}

interface EventRating {
  rating: number;
  comment: string | null;
  user_id: string;
  created_at: string;
}

const MyEvents = () => {
  const [upcomingRsvps, setUpcomingRsvps] = useState<RSVPWithEvent[]>([]);
  const [pastRsvps, setPastRsvps] = useState<RSVPWithEvent[]>([]);
  const [hostedEvents, setHostedEvents] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [eventAttendees, setEventAttendees] = useState<Record<string, AttendeeInfo[]>>({});
  const [eventRatings, setEventRatings] = useState<Record<string, EventRating[]>>({});
  
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) fetchEvents();
  }, [profile]);

  const fetchEvents = async () => {
    if (!profile) return;
    setLoading(true);

    try {
      const { data: rsvps } = await supabase
        .from('rsvps')
        .select(`id, status, event:events(id, title, category, date_time, location, current_attendees, cover_image_url)`)
        .eq('user_id', profile.id)
        .not('event', 'is', null);

      if (rsvps) {
        const validRsvps = rsvps.filter(r => r.event !== null) as RSVPWithEvent[];
        setUpcomingRsvps(validRsvps.filter(r => new Date(r.event.date_time) >= new Date()));
        setPastRsvps(validRsvps.filter(r => new Date(r.event.date_time) < new Date()));
      }

      const { data: hosted } = await supabase
        .from('events')
        .select('id, title, category, date_time, location, current_attendees, cover_image_url')
        .eq('host_id', profile.id)
        .order('date_time', { ascending: true });

      if (hosted) setHostedEvents(hosted);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleEventDetails = async (eventId: string) => {
    if (expandedEvent === eventId) {
      setExpandedEvent(null);
      return;
    }
    setExpandedEvent(eventId);

    // Fetch attendees and ratings if not cached
    if (!eventAttendees[eventId]) {
      const { data: attendees } = await supabase
        .from('rsvps')
        .select(`id, status, profile:profiles(id, name, nickname, program, avatar_url, instagram_handle)`)
        .eq('event_id', eventId);

      if (attendees) {
        setEventAttendees(prev => ({ ...prev, [eventId]: attendees as AttendeeInfo[] }));
      }
    }

    if (!eventRatings[eventId]) {
      const { data: ratings } = await supabase
        .from('event_ratings')
        .select('rating, comment, user_id, created_at')
        .eq('event_id', eventId);

      if (ratings) {
        setEventRatings(prev => ({ ...prev, [eventId]: ratings }));
      }
    }
  };

  const formatDate = (ds: string) => new Date(ds).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const formatTime = (ds: string) => new Date(ds).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const avgRating = (eventId: string) => {
    const ratings = eventRatings[eventId];
    if (!ratings || ratings.length === 0) return null;
    return (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1);
  };

  const EventCard = ({ event, status }: { event: EventWithDetails; status?: string }) => {
    const categoryConfig = CATEGORY_CONFIG[event.category] || { label: event.category, color: 'bg-primary' };
    return (
      <button onClick={() => navigate(`/event/${event.id}`)}
        className="w-full flex gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all text-left">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
          {event.cover_image_url ? (
            <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full ${categoryConfig.color} opacity-50`} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground line-clamp-1">{event.title}</h3>
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <Calendar className="w-3 h-3" /><span>{formatDate(event.date_time)}</span>
            <Clock className="w-3 h-3 ml-1" /><span>{formatTime(event.date_time)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <MapPin className="w-3 h-3" /><span className="line-clamp-1">{event.location}</span>
          </div>
          {status && (
            <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${
              status === 'confirmed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              : 'bg-muted text-muted-foreground'
            }`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
          )}
        </div>
      </button>
    );
  };

  const HostedEventCard = ({ event }: { event: EventWithDetails }) => {
    const isExpanded = expandedEvent === event.id;
    const attendees = eventAttendees[event.id] || [];
    const ratings = eventRatings[event.id] || [];
    const avg = avgRating(event.id);
    const confirmed = attendees.filter(a => a.status === 'confirmed');
    const pending = attendees.filter(a => a.status === 'pending');

    return (
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <button onClick={() => navigate(`/event/${event.id}`)}
          className="w-full flex gap-4 p-4 text-left hover:bg-muted/30 transition-colors">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
            {event.cover_image_url ? (
              <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary/20" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground line-clamp-1">{event.title}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <Calendar className="w-3 h-3" /><span>{formatDate(event.date_time)}</span>
              <Users className="w-3 h-3 ml-1" /><span>{event.current_attendees} attendees</span>
            </div>
          </div>
        </button>

        {/* Expand toggle */}
        <button onClick={() => toggleEventDetails(event.id)}
          className="w-full px-4 py-2 border-t border-border flex items-center justify-center gap-2 text-xs text-primary font-medium hover:bg-muted/30 transition-colors">
          {isExpanded ? <><ChevronUp className="w-3 h-3" /> Hide Details</> : <><ChevronDown className="w-3 h-3" /> View Attendees & Ratings</>}
        </button>

        {isExpanded && (
          <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
            {/* Rating Summary */}
            {avg && (
              <div className="flex items-center gap-2 bg-primary/5 rounded-lg p-3">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="font-semibold">{avg}</span>
                <span className="text-sm text-muted-foreground">({ratings.length} ratings)</span>
              </div>
            )}

            {/* Confirmed Attendees */}
            {confirmed.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 text-foreground">Confirmed ({confirmed.length})</h4>
                <div className="space-y-2">
                  {confirmed.map(a => (
                    <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary">
                          {(a.profile?.nickname || a.profile?.name || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{a.profile?.nickname || a.profile?.name || 'User'}</p>
                        {a.profile?.program && <p className="text-xs text-muted-foreground">{a.profile.program}</p>}
                      </div>
                      {a.profile?.instagram_handle && (
                        <span className="text-xs text-muted-foreground">@{a.profile.instagram_handle}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending */}
            {pending.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 text-foreground">Pending ({pending.length})</h4>
                <div className="space-y-2">
                  {pending.map(a => (
                    <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/10">
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <span className="text-xs font-semibold text-amber-600">
                          {(a.profile?.nickname || a.profile?.name || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm">{a.profile?.nickname || a.profile?.name || 'User'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Individual Ratings */}
            {ratings.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 text-foreground">Feedback</h4>
                <div className="space-y-2">
                  {ratings.map((r, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                        ))}
                      </div>
                      {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {attendees.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No attendees yet</p>}
          </div>
        )}
      </div>
    );
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">Sign in to see your events</h2>
          <p className="text-muted-foreground">Track your RSVPs and hosted events</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="px-4 h-14 flex items-center justify-between">
          <h1 className="font-display text-xl font-bold">My Events</h1>
          <Button variant="ghost" size="icon"><Bell className="w-5 h-5" /></Button>
        </div>
      </header>

      <div className="p-4">
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="upcoming">Upcoming ({upcomingRsvps.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({pastRsvps.length})</TabsTrigger>
            <TabsTrigger value="hosted">Hosted ({hostedEvents.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
            ) : upcomingRsvps.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No upcoming events</p>
                <p className="text-sm text-muted-foreground mt-1">Swipe right on events to RSVP!</p>
              </div>
            ) : upcomingRsvps.map(rsvp => <EventCard key={rsvp.id} event={rsvp.event} status={rsvp.status} />)}
          </TabsContent>

          <TabsContent value="past" className="space-y-3">
            {pastRsvps.length === 0 ? (
              <div className="text-center py-12"><p className="text-muted-foreground">No past events</p></div>
            ) : pastRsvps.map(rsvp => <EventCard key={rsvp.id} event={rsvp.event} status={rsvp.status} />)}
          </TabsContent>

          <TabsContent value="hosted" className="space-y-3">
            {hostedEvents.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hosted events yet</p>
                <p className="text-sm text-muted-foreground mt-1">Create your first event!</p>
              </div>
            ) : hostedEvents.map(event => <HostedEventCard key={event.id} event={event} />)}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default MyEvents;
