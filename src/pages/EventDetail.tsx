import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import UserProfileSheet from '@/components/UserProfileSheet';
import { 
  ArrowLeft, Calendar, Clock, MapPin, Users, Share2,
  Heart, Shield, X, ChevronRight, Star, ExternalLink
} from 'lucide-react';

interface EventDetails {
  id: string;
  title: string;
  description: string | null;
  category: string;
  date_time: string;
  location: string;
  location_details: string | null;
  is_on_campus: boolean;
  capacity: number | null;
  current_attendees: number;
  access_type: string;
  capacity_status: string;
  cover_image_url: string | null;
  event_rules: string | null;
  is_free: boolean;
  price: number | null;
  external_link?: string | null;
  host: {
    id: string;
    name: string | null;
    nickname: string | null;
    is_verified: boolean;
    avatar_url: string | null;
  } | null;
  school: { name: string } | null;
}

interface Attendee {
  id: string;
  profile: { name: string | null; nickname: string | null };
}

const CATEGORY_LABELS: Record<string, string> = {
  art_exhibition: 'Art Exhibition', book_club: 'Book Club', lecture: 'Lecture',
  garage_sale: 'Garage Sale', study_session: 'Study Session', party: 'Party',
  networking: 'Networking', cooking_class: 'Cooking Class', food_exploration: 'Food',
  car_meetup: 'Car Meetup', sports: 'Sports', creative_workshop: 'Workshop',
  free_drinks: 'Free Drinks', cafe_gathering: 'Cafe', club_info_session: 'Club Info',
};

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { toast } = useToast();
  
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [userRsvp, setUserRsvp] = useState<{ id: string; status: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);

  // Rating state
  const [showRating, setShowRating] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [existingRating, setExistingRating] = useState<{ rating: number; comment: string | null } | null>(null);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  useEffect(() => {
    if (id) fetchEvent();
  }, [id, profile]);

  const isPastEvent = event ? new Date(event.date_time) < new Date() : false;

  const fetchEvent = async () => {
    setLoading(true);
    try {
      const { data: eventData, error } = await supabase
        .from('events')
        .select(`*, host:profiles!events_host_id_fkey(id, name, nickname, is_verified, avatar_url), school:schools(name)`)
        .eq('id', id)
        .single();

      if (error) throw error;
      setEvent(eventData as any);

      const { data: rsvps } = await supabase
        .from('rsvps')
        .select(`id, profile:profiles(name, nickname)`)
        .eq('event_id', id)
        .eq('status', 'confirmed')
        .limit(10);

      if (rsvps) setAttendees(rsvps as Attendee[]);

      if (profile) {
        const { data: existingRsvp } = await supabase
          .from('rsvps')
          .select('id, status')
          .eq('event_id', id)
          .eq('user_id', profile.id)
          .maybeSingle();
        setUserRsvp(existingRsvp);

        // Check existing rating
        const { data: rating } = await supabase
          .from('event_ratings')
          .select('rating, comment')
          .eq('event_id', id)
          .eq('user_id', profile.id)
          .maybeSingle();
        if (rating) {
          setExistingRating(rating);
          setUserRating(rating.rating);
        }
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load event details.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRsvp = async () => {
    if (!profile || !event) return;
    setRsvpLoading(true);
    try {
      if (userRsvp) {
        await supabase.from('rsvps').delete().eq('id', userRsvp.id);
        setUserRsvp(null);
        toast({ title: 'RSVP cancelled' });
      } else {
        const { data, error } = await supabase.from('rsvps').insert({
          user_id: profile.id, event_id: event.id,
          status: event.access_type === 'open_rsvp' ? 'confirmed' : 'pending',
        }).select().single();
        if (error) throw error;
        setUserRsvp(data);
        toast({ title: event.access_type === 'open_rsvp' ? '🎉 You\'re in!' : 'Request sent' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Something went wrong.' });
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleRatingSubmit = async () => {
    if (!profile || !event || userRating === 0) return;
    setRatingSubmitting(true);
    try {
      const payload = {
        event_id: event.id,
        user_id: profile.id,
        rating: userRating,
        comment: ratingComment || null,
        attended: true,
      };

      if (existingRating) {
        await supabase.from('event_ratings').update(payload)
          .eq('event_id', event.id).eq('user_id', profile.id);
      } else {
        await supabase.from('event_ratings').insert(payload);
      }

      setExistingRating({ rating: userRating, comment: ratingComment || null });
      setShowRating(false);
      toast({ title: 'Thanks for your feedback! ⭐' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit rating.' });
    } finally {
      setRatingSubmitting(false);
    }
  };

  const formatDate = (ds: string) => new Date(ds).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const formatTime = (ds: string) => new Date(ds).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!event) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <h2 className="font-display text-xl font-bold mb-2">Event not found</h2>
      <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
    </div>
  );

  const canRate = isPastEvent && userRsvp?.status === 'confirmed' && !existingRating;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon"><Share2 className="w-5 h-5" /></Button>
        </div>
      </header>

      {event.cover_image_url && (
        <div className="aspect-video bg-muted">
          <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="p-4 space-y-6">
        <div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground mb-3">
            {CATEGORY_LABELS[event.category] || event.category}
          </span>
          <h1 className="font-display text-2xl font-bold">{event.title}</h1>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Calendar className="w-5 h-5 text-primary" /></div>
            <div>
              <p className="font-medium">{formatDate(event.date_time)}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(event.date_time)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><MapPin className="w-5 h-5 text-primary" /></div>
            <div>
              <p className="font-medium">{event.location}</p>
              {event.is_on_campus && <p className="text-sm text-muted-foreground">On Campus</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Users className="w-5 h-5 text-primary" /></div>
            <div>
              <p className="font-medium">{event.current_attendees} going{event.capacity && <span className="text-muted-foreground"> / {event.capacity} spots</span>}</p>
              <p className="text-sm text-muted-foreground capitalize">{event.access_type.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        {/* External Link */}
        {(event as any).external_link && (
          <a href={(event as any).external_link} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 bg-card rounded-xl border border-border p-4 hover:bg-muted/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><ExternalLink className="w-5 h-5 text-primary" /></div>
            <div className="flex-1 min-w-0">
              <p className="font-medium">Visit Link</p>
              <p className="text-sm text-muted-foreground truncate">{(event as any).external_link}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </a>
        )}

        {/* Host */}
        <button onClick={() => { if (event.host?.id) { setSelectedUserId(event.host.id); setProfileSheetOpen(true); } }}
          className="bg-card rounded-xl border border-border p-4 w-full text-left hover:bg-muted/50 transition-colors">
          <p className="text-xs text-muted-foreground mb-2">Hosted by</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-semibold text-primary">{(event.host?.nickname || event.host?.name || 'H')[0].toUpperCase()}</span>
            </div>
            <div className="flex-1">
              <p className="font-medium flex items-center gap-1">
                {event.host?.nickname || event.host?.name || 'Host'}
                {event.host?.is_verified && <Shield className="w-4 h-4 text-primary" />}
              </p>
              {event.school && <p className="text-sm text-muted-foreground">{event.school.name}</p>}
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </button>

        {event.description && (
          <div><h3 className="font-semibold mb-2">About</h3><p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p></div>
        )}
        {event.event_rules && (
          <div><h3 className="font-semibold mb-2">Event Rules</h3><p className="text-muted-foreground whitespace-pre-wrap">{event.event_rules}</p></div>
        )}

        {/* Attendees */}
        {attendees.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Who's Going</h3>
            <div className="flex flex-wrap gap-2">
              {attendees.map((a) => (
                <div key={a.id} className="flex items-center gap-2 px-3 py-2 rounded-full bg-muted">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                    {(a.profile?.nickname || a.profile?.name || 'U')[0].toUpperCase()}
                  </div>
                  <span className="text-sm">{a.profile?.nickname || a.profile?.name}</span>
                </div>
              ))}
              {event.current_attendees > attendees.length && (
                <div className="px-3 py-2 rounded-full bg-muted text-sm text-muted-foreground">+{event.current_attendees - attendees.length} more</div>
              )}
            </div>
          </div>
        )}

        {/* Rating Section for past events */}
        {canRate && !showRating && (
          <Button onClick={() => setShowRating(true)} variant="outline" className="w-full flex items-center gap-2">
            <Star className="w-4 h-4" /> Rate this Event
          </Button>
        )}

        {existingRating && (
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-sm font-medium mb-2">Your Rating</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`w-5 h-5 ${s <= existingRating.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
              ))}
            </div>
          </div>
        )}

        {showRating && (
          <div className="bg-card rounded-xl border border-border p-4 space-y-4">
            <h3 className="font-semibold">How was the event?</h3>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} type="button"
                  onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setUserRating(s)}>
                  <Star className={`w-8 h-8 transition-colors ${s <= (hoverRating || userRating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                </button>
              ))}
            </div>
            <textarea placeholder="Leave feedback (optional)..." rows={2}
              className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowRating(false)}>Cancel</Button>
              <Button variant="hero" className="flex-1" disabled={userRating === 0 || ratingSubmitting} onClick={handleRatingSubmit}>
                {ratingSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* RSVP Button */}
      {user && profile && !isPastEvent && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
          <Button onClick={handleRsvp} disabled={rsvpLoading}
            className={`w-full ${userRsvp ? 'bg-muted text-foreground hover:bg-destructive hover:text-destructive-foreground' : 'gradient-warm text-primary-foreground'}`}>
            {rsvpLoading ? (
              <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />Loading...</span>
            ) : userRsvp ? (
              <span className="flex items-center gap-2"><X className="w-4 h-4" />Cancel RSVP</span>
            ) : (
              <span className="flex items-center gap-2"><Heart className="w-4 h-4" />RSVP to Event</span>
            )}
          </Button>
        </div>
      )}

      {selectedUserId && (
        <UserProfileSheet open={profileSheetOpen} onOpenChange={setProfileSheetOpen} userId={selectedUserId} />
      )}
    </div>
  );
};

export default EventDetail;
