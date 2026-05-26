import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/AppLayout';
import SwipeCard from '@/components/SwipeCard';
import { Button } from '@/components/ui/button';
import { RefreshCw, Sparkles, PartyPopper } from 'lucide-react';

interface EventWithRelations {
  id: string;
  title: string;
  description: string | null;
  category: string;
  date_time: string;
  location: string;
  is_on_campus: boolean;
  capacity: number | null;
  current_attendees: number;
  access_type: string;
  capacity_status: string;
  cover_image_url: string | null;
  is_trending?: boolean;
  tags?: string[];
  average_rating?: number;
  is_free?: boolean;
  price?: number;
  host: {
    id?: string;
    name: string | null;
    nickname: string | null;
    is_verified: boolean;
  } | null;
  school: {
    name: string;
  } | null;
}

const WEEKLY_LIMIT = 7;

const Activities = () => {
  const [events, setEvents] = useState<EventWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [rsvpCount, setRsvpCount] = useState(0);
  const [mutualCounts, setMutualCounts] = useState<Record<string, number>>({});
  const [lastSwipe, setLastSwipe] = useState<{
    event: EventWithRelations;
    direction: 'left' | 'right';
    index: number;
  } | null>(null);
  
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get start of current week (Monday)
  const getWeekStart = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString();
  };

  useEffect(() => {
    if (profile) {
      fetchWeeklySwipes();
      fetchEvents();
    } else if (user) {
      // User is logged in but profile not loaded yet - stop loading
      setLoading(false);
    }
  }, [profile, user]);

  const fetchWeeklySwipes = async () => {
    if (!profile) return;
    const weekStart = getWeekStart();
    
    const [{ count: swipeCount }, { count: rsvpTotal }] = await Promise.all([
      supabase
        .from('event_swipes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .gte('created_at', weekStart),
      supabase
        .from('rsvps')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .gte('created_at', weekStart),
    ]);

    setWeeklyCount(swipeCount || 0);
    setRsvpCount(rsvpTotal || 0);
  };

  const fetchEvents = async () => {
    setLoading(true);
    
    try {
      const weekStart = getWeekStart();
      
      // Get user's already swiped events
      let swipedEventIds: string[] = [];
      let followedIds: string[] = [];
      
      if (profile) {
        const [swipesResult, followsResult] = await Promise.all([
          supabase
            .from('event_swipes')
            .select('event_id')
            .eq('user_id', profile.id),
          supabase
            .from('user_follows')
            .select('following_id')
            .eq('follower_id', profile.id),
        ]);
        
        swipedEventIds = swipesResult.data?.map(s => s.event_id) || [];
        followedIds = followsResult.data?.map(f => f.following_id) || [];
      }

      // Fetch upcoming events
      const { data: eventsData, error } = await supabase
        .from('events')
        .select(`
          *,
          host:profiles!events_host_id_fkey(id, name, nickname, is_verified),
          school:schools(name)
        `)
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: true })
        .limit(50);

      if (error) throw error;

      // Filter out already swiped events
      let filtered = (eventsData || []).filter(
        e => !swipedEventIds.includes(e.id)
      );

      // Personalize: score by interest overlap & friends attending
      if (profile?.interests && profile.interests.length > 0) {
        filtered = filtered.map(event => {
          let score = 0;
          // Boost events matching user interests via tags
          if (event.tags) {
            const overlap = event.tags.filter((t: string) => 
              profile.interests.some(i => t.toLowerCase().includes(i.toLowerCase()))
            ).length;
            score += overlap * 10;
          }
          // Boost events from followed hosts
          if (followedIds.includes(event.host_id)) {
            score += 20;
          }
          // Boost trending
          if (event.is_trending) score += 5;
          return { ...event, _score: score };
        }).sort((a: any, b: any) => b._score - a._score);
      }

      // Limit to 7 curated events for the week
      const remaining = WEEKLY_LIMIT - (weeklyCount || 0);
      const curated = filtered.slice(0, Math.max(remaining, 0));

      // Get mutual counts for curated events
      if (followedIds.length > 0 && curated.length > 0) {
        const eventIds = curated.map(e => e.id);
        const { data: friendRsvps } = await supabase
          .from('rsvps')
          .select('event_id, user_id')
          .in('user_id', followedIds)
          .in('event_id', eventIds)
          .eq('status', 'confirmed');

        if (friendRsvps) {
          const counts: Record<string, number> = {};
          friendRsvps.forEach(rsvp => {
            counts[rsvp.event_id] = (counts[rsvp.event_id] || 0) + 1;
          });
          setMutualCounts(counts);
        }
      }

      setEvents(curated as EventWithRelations[]);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load events. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    const currentEvent = events[currentIndex];
    if (!currentEvent || !profile) return;

    try {
      await supabase.from('event_swipes').insert({
        user_id: profile.id,
        event_id: currentEvent.id,
        swiped_right: direction === 'right',
      });

      if (direction === 'right') {
        const { error: rsvpError } = await supabase.from('rsvps').insert({
          user_id: profile.id,
          event_id: currentEvent.id,
          status: currentEvent.access_type === 'open_rsvp' ? 'confirmed' : 'pending',
        });

        if (!rsvpError) {
          setRsvpCount(prev => prev + 1);
          toast({
            title: '🎉 RSVP\'d!',
            description: `You're going to "${currentEvent.title}"!`,
          });
        }
      }

      setLastSwipe({ event: currentEvent, direction, index: currentIndex });
      setWeeklyCount(prev => prev + 1);
      setCurrentIndex(prev => prev + 1);
    } catch (error) {
      console.error('Error handling swipe:', error);
    }
  };

  const handleUndo = async () => {
    if (!lastSwipe || !profile) return;
    const { event, direction, index } = lastSwipe;

    try {
      await supabase
        .from('event_swipes')
        .delete()
        .eq('user_id', profile.id)
        .eq('event_id', event.id);

      if (direction === 'right') {
        await supabase
          .from('rsvps')
          .delete()
          .eq('user_id', profile.id)
          .eq('event_id', event.id);
        setRsvpCount(prev => Math.max(prev - 1, 0));
      }

      // Restore card into the deck at its prior position
      setEvents(prev => {
        const next = [...prev];
        if (!next.find(e => e.id === event.id)) {
          next.splice(index, 0, event);
        }
        return next;
      });
      setCurrentIndex(index);
      setWeeklyCount(prev => Math.max(prev - 1, 0));
      setLastSwipe(null);

      toast({
        title: 'Undone',
        description: `Restored "${event.title}".`,
      });
    } catch (error) {
      console.error('Error undoing swipe:', error);
      toast({
        variant: 'destructive',
        title: 'Could not undo',
        description: 'Please try again.',
      });
    }
  };

  const handleTap = () => {
    const currentEvent = events[currentIndex];
    if (currentEvent) {
      navigate(`/event/${currentEvent.id}`);
    }
  };

  const currentEvent = events[currentIndex];
  const hasMoreEvents = currentIndex < events.length;
  const weeklyRemaining = Math.max(WEEKLY_LIMIT - weeklyCount, 0);

  if (!user) {
    return (
      <AppLayout hideNav>
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <div className="w-20 h-20 rounded-2xl gradient-warm flex items-center justify-center mb-6 shadow-glow">
            <Sparkles className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">Welcome to GatherUs</h1>
          <p className="text-muted-foreground mb-8">
            Sign in to discover campus events and student activities
          </p>
          <Button 
            onClick={() => navigate('/auth')}
            className="gradient-warm text-primary-foreground"
          >
            Get Started
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div>
            <h1 className="font-display text-xl font-bold">Your Weekly 7</h1>
            <p className="text-xs text-muted-foreground">
              {weeklyRemaining > 0 
                ? `${weeklyRemaining} left · ${rsvpCount} RSVP${rsvpCount !== 1 ? 's' : ''} this week`
                : `All caught up · ${rsvpCount} RSVP${rsvpCount !== 1 ? 's' : ''} this week`
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Weekly progress dots */}
            <div className="flex gap-1">
              {Array.from({ length: WEEKLY_LIMIT }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i < weeklyCount ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleUndo}
              disabled={!lastSwipe}
              aria-label="Undo last swipe"
            >
              <Undo2 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={fetchEvents}>
              <RefreshCw className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Swipe Area */}
      <div className="relative h-[calc(100vh-8rem)] flex items-center justify-center overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground">Curating your events...</p>
          </div>
        ) : weeklyRemaining <= 0 ? (
          <div className="flex flex-col items-center gap-4 px-8 text-center">
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
              <PartyPopper className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="font-display text-xl font-bold">You've seen all 7!</h2>
            <p className="text-muted-foreground">
              Come back next week for a fresh batch of curated events
            </p>
          </div>
        ) : hasMoreEvents && currentEvent ? (
          <AnimatePresence mode="popLayout">
            <SwipeCard
              key={currentEvent.id}
              event={currentEvent}
              onSwipe={handleSwipe}
              onTap={handleTap}
              isFirst={currentIndex === 0}
              friendsAttending={mutualCounts[currentEvent.id] || 0}
            />
          </AnimatePresence>
        ) : (
          <div className="flex flex-col items-center gap-4 px-8 text-center">
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
              <PartyPopper className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="font-display text-xl font-bold">You're all caught up!</h2>
            <p className="text-muted-foreground">
              Check back later for more events, or create your own!
            </p>
            <Button 
              onClick={fetchEvents}
              variant="outline"
              className="mt-4"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        )}

        {/* Swipe Instructions */}
        {hasMoreEvents && currentEvent && weeklyRemaining > 0 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-8 text-sm text-muted-foreground">
            <span>← Skip</span>
            <span>Tap for details</span>
            <span>RSVP →</span>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Activities;
