import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/AppLayout';
import SwipeCard from '@/components/SwipeCard';
import { Button } from '@/components/ui/button';
import { FilterSheet, FilterState, defaultFilters } from '@/components/FilterSheet';
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

const Activities = () => {
  const [events, setEvents] = useState<EventWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [mutualCounts, setMutualCounts] = useState<Record<string, number>>({});
  
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, [profile, filters]);

  const fetchEvents = async () => {
    setLoading(true);
    
    try {
      // Fetch events with host and school info
      let query = supabase
        .from('events')
        .select(`
          *,
          host:profiles!events_host_id_fkey(id, name, nickname, is_verified),
          school:schools(name)
        `)
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: true })
        .limit(50);

      // Apply filters
      if (filters.categories.length > 0) {
        query = query.in('category', filters.categories as any);
      }
      if (filters.freeOnly) {
        query = query.eq('is_free', true);
      }
      if (filters.openOnly) {
        query = query.eq('access_type', 'open_rsvp');
      }
      if (filters.maxGroupSize) {
        query = query.lte('capacity', filters.maxGroupSize);
      }

      const { data: eventsData, error } = await query;

      if (error) throw error;

      // Get user's already swiped events to filter them out
      let swipedEventIds: string[] = [];
      if (profile) {
        const { data: swipes } = await supabase
          .from('event_swipes')
          .select('event_id')
          .eq('user_id', profile.id);
        
        if (swipes) {
          swipedEventIds = swipes.map(s => s.event_id);
        }

        // Get followed users for mutual count
        const { data: follows } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', profile.id);

        if (follows && follows.length > 0) {
          const followedIds = follows.map(f => f.following_id);
          
          // Get RSVPs from followed users
          const { data: friendRsvps } = await supabase
            .from('rsvps')
            .select('event_id, user_id')
            .in('user_id', followedIds)
            .eq('status', 'confirmed');

          if (friendRsvps) {
            const counts: Record<string, number> = {};
            friendRsvps.forEach(rsvp => {
              counts[rsvp.event_id] = (counts[rsvp.event_id] || 0) + 1;
            });
            setMutualCounts(counts);
          }
        }
      }

      // Filter out already swiped events
      const filteredEvents = (eventsData || []).filter(
        e => !swipedEventIds.includes(e.id)
      );

      setEvents(filteredEvents as EventWithRelations[]);
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
      // Record the swipe
      await supabase.from('event_swipes').insert({
        user_id: profile.id,
        event_id: currentEvent.id,
        swiped_right: direction === 'right',
      });

      // If swiped right, create RSVP
      if (direction === 'right') {
        const { error: rsvpError } = await supabase.from('rsvps').insert({
          user_id: profile.id,
          event_id: currentEvent.id,
          status: currentEvent.access_type === 'open_rsvp' ? 'confirmed' : 'pending',
        });

        if (!rsvpError) {
          toast({
            title: direction === 'right' ? '🎉 RSVP\'d!' : 'Skipped',
            description: direction === 'right' 
              ? `You're going to "${currentEvent.title}"!`
              : 'Maybe next time!',
          });
        }
      }

      // Move to next card
      setCurrentIndex(prev => prev + 1);
    } catch (error) {
      console.error('Error handling swipe:', error);
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
          <h1 className="font-display text-xl font-bold">Activities</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={fetchEvents}>
              <RefreshCw className="w-5 h-5" />
            </Button>
            <FilterSheet filters={filters} onFiltersChange={setFilters} />
          </div>
        </div>
      </header>

      {/* Swipe Area */}
      <div className="relative h-[calc(100vh-8rem)] flex items-center justify-center overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground">Loading events...</p>
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
        {hasMoreEvents && currentEvent && (
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
