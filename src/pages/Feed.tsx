import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/AppLayout';
import UserProfileSheet from '@/components/UserProfileSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { CATEGORY_CONFIG, CATEGORY_GROUPS } from '@/lib/constants';
import { 
  Calendar, 
  MapPin, 
  Users, 
  TrendingUp, 
  Link as LinkIcon,
  Star,
  ChevronRight,
  PartyPopper,
  UtensilsCrossed,
  Dumbbell,
  BookOpen,
  Palette,
  Handshake
} from 'lucide-react';

interface EventPost {
  id: string;
  title: string;
  category: string;
  date_time: string;
  location: string;
  current_attendees: number;
  cover_image_url: string | null;
  is_trending?: boolean;
  host: {
    id: string;
    name: string | null;
    nickname: string | null;
    is_verified: boolean;
  } | null;
  school: {
    name: string;
  } | null;
  mutuals_count?: number;
  external_url?: string;
  source?: 'eventbrite';
}

interface SuggestedUser {
  id: string;
  name: string | null;
  nickname: string | null;
  program: string | null;
  is_verified: boolean;
  interests: string[];
  match_percentage?: number;
}

const CATEGORY_GROUP_CONFIG: Record<string, { label: string; icon: React.ComponentType<any>; categories: string[] }> = {
  party: { label: 'Party & Nightlife', icon: PartyPopper, categories: CATEGORY_GROUPS.party },
  food: { label: 'Food & Drinks', icon: UtensilsCrossed, categories: CATEGORY_GROUPS.food },
  sports: { label: 'Sports & Outdoors', icon: Dumbbell, categories: CATEGORY_GROUPS.sports },
  study: { label: 'Study & Learning', icon: BookOpen, categories: CATEGORY_GROUPS.study },
  creative: { label: 'Arts & Culture', icon: Palette, categories: CATEGORY_GROUPS.creative },
  social: { label: 'Networking & Social', icon: Handshake, categories: CATEGORY_GROUPS.social },
};

const Feed = () => {
  const [friendEvents, setFriendEvents] = useState<EventPost[]>([]);
  const [eventsByCategory, setEventsByCategory] = useState<Record<string, EventPost[]>>({});
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState('');
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      fetchFeed();
      fetchSuggestedUsers();
      fetchFollowedUsers();
    }
  }, [profile]);

  const fetchFollowedUsers = async () => {
    if (!profile) return;
    
    const { data } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', profile.id);
    
    if (data) {
      setFollowedIds(new Set(data.map(f => f.following_id)));
    }
  };

  const fetchExternalEvents = async (): Promise<EventPost[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-external-events');
      if (error) {
        console.warn('External events unavailable:', error.message);
        return [];
      }
      const events: Array<{ id: string; title: string; category: string; date_time: string; location: string; cover_image_url: string | null; current_attendees: number; url: string; source: 'eventbrite' }> = data?.events || [];
      return events.map(e => ({
        id: e.id,
        title: e.title,
        category: e.category,
        date_time: e.date_time,
        location: e.location,
        current_attendees: e.current_attendees,
        cover_image_url: e.cover_image_url,
        is_trending: false,
        host: null,
        school: null,
        external_url: e.url,
        source: e.source,
      }));
    } catch {
      return [];
    }
  };

  const fetchFeed = async () => {
    setLoading(true);
    
    try {
      // Fetch local + external events in parallel
      const [followsResult, eventsResult, externalEvents] = await Promise.all([
        supabase.from('user_follows').select('following_id').eq('follower_id', profile?.id || ''),
        supabase
          .from('events')
          .select(`
            id, title, category, date_time, location, current_attendees, 
            average_rating, cover_image_url, is_trending,
            host:profiles!events_host_id_fkey(id, name, nickname, is_verified),
            school:schools(name)
          `)
          .gte('date_time', new Date().toISOString())
          .order('date_time', { ascending: true })
          .limit(100),
        fetchExternalEvents(),
      ]);

      const followedHostIds = followsResult.data?.map(f => f.following_id) || [];
      if (eventsResult.error) throw eventsResult.error;

      // Get RSVPs from followed users
      let mutualCounts: Record<string, number> = {};
      if (followedHostIds.length > 0) {
        const eventIds = eventsResult.data?.map(e => e.id) || [];
        const { data: friendRsvps } = await supabase
          .from('rsvps')
          .select('event_id, user_id')
          .in('event_id', eventIds)
          .in('user_id', followedHostIds)
          .eq('status', 'confirmed');

        if (friendRsvps) {
          friendRsvps.forEach(rsvp => {
            mutualCounts[rsvp.event_id] = (mutualCounts[rsvp.event_id] || 0) + 1;
          });
        }
      }

      const localEventsWithMutuals = (eventsResult.data || []).map(event => ({
        ...event,
        mutuals_count: mutualCounts[event.id] || 0,
      })) as EventPost[];

      // Separate friend events
      const friendEventIds = new Set(Object.keys(mutualCounts));
      const friendHostedEvents = localEventsWithMutuals.filter(
        e => followedHostIds.includes(e.host?.id || '') || friendEventIds.has(e.id)
      );
      setFriendEvents(friendHostedEvents.slice(0, 20));

      // Merge local + external events for category rows
      const allEvents = [...localEventsWithMutuals, ...externalEvents];

      const grouped: Record<string, EventPost[]> = {};
      Object.keys(CATEGORY_GROUP_CONFIG).forEach(groupKey => {
        const config = CATEGORY_GROUP_CONFIG[groupKey];
        grouped[groupKey] = allEvents.filter(e => 
          config.categories.includes(e.category)
        ).slice(0, 10);
      });
      setEventsByCategory(grouped);
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestedUsers = async () => {
    if (!profile) return;

    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, nickname, program, is_verified, interests')
        .neq('id', profile.id)
        .limit(10);

      if (data) {
        // Calculate match percentages in parallel
        const withMatch = await Promise.all(
          data.map(async (u) => {
            const { data: matchData } = await supabase.rpc('calculate_match_percentage', {
              profile_a: profile.id,
              profile_b: u.id,
            });
            return {
              ...u,
              match_percentage: matchData ?? 0,
              overlap: (u.interests || []).filter((i: string) => 
                (profile.interests || []).includes(i)
              ).length,
            };
          })
        );

        const sorted = withMatch.sort((a, b) => 
          (b.match_percentage + b.overlap * 10) - (a.match_percentage + a.overlap * 10)
        );
        setSuggestedUsers(sorted.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleFollow = async (userId: string) => {
    if (!profile) return;

    try {
      await supabase.from('user_follows').insert({
        follower_id: profile.id,
        following_id: userId,
      });
      
      setFollowedIds(prev => new Set([...prev, userId]));
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleUnfollow = async (userId: string) => {
    if (!profile) return;

    try {
      await supabase.from('user_follows')
        .delete()
        .eq('follower_id', profile.id)
        .eq('following_id', userId);
      
      setFollowedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };

  const handleInviteCode = async () => {
    if (!inviteCode.trim()) return;
    
    const { data } = await supabase
      .from('events')
      .select('id')
      .eq('invite_code', inviteCode.trim())
      .single();

    if (data) {
      navigate(`/event/${data.id}`);
    }
    setInviteCode('');
  };

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setProfileSheetOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const EventCard = ({ event, compact = false }: { event: EventPost; compact?: boolean }) => {
    const categoryConfig = CATEGORY_CONFIG[event.category] || { label: event.category, color: 'bg-primary' };
    const isExternal = !!event.source;

    const handleClick = () => {
      if (isExternal && event.external_url) {
        window.open(event.external_url, '_blank', 'noopener,noreferrer');
      } else {
        navigate(`/event/${event.id}`);
      }
    };

    const sourceBadge = event.source === 'eventbrite' ? '🎟 Eventbrite' : null;
    
    return (
      <button
        onClick={handleClick}
        className={`flex-shrink-0 bg-card rounded-2xl border border-border overflow-hidden text-left hover:border-primary/30 transition-all ${
          compact ? 'w-44' : 'w-72'
        }`}
      >
        {/* Image */}
        <div className={`bg-muted relative ${compact ? 'h-24' : 'aspect-video'}`}>
          {event.cover_image_url ? (
            <img 
              src={event.cover_image_url} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          {event.is_trending && (
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
            </span>
          )}
          {sourceBadge && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] bg-background/80 backdrop-blur-sm border border-border text-foreground font-medium">
              {sourceBadge}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded-full text-[10px] text-white ${categoryConfig.color}`}>
              {categoryConfig.label}
            </span>
          </div>
          <h3 className={`font-semibold line-clamp-2 mb-1 ${compact ? 'text-sm' : 'text-base'}`}>
            {event.title}
          </h3>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(event.date_time)}
            </span>
          </div>

          {/* Host or external source */}
          {isExternal ? (
            <div className="flex items-center gap-2">
              <LinkIcon className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground truncate">View on Eventbrite</span>
            </div>
          ) : (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (event.host?.id) handleUserClick(event.host.id);
              }}
              className="flex items-center gap-2 hover:bg-muted rounded-lg p-1 -ml-1 transition-colors"
            >
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-[10px] font-semibold text-primary">
                  {(event.host?.nickname || event.host?.name || 'H')[0].toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-muted-foreground truncate">
                {event.host?.nickname || event.host?.name || 'Host'}
              </span>
            </button>
          )}

          {/* Stats */}
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
            <span className="flex items-center gap-1 text-xs">
              <Users className="w-3 h-3" />
              {event.current_attendees}
            </span>
            {event.mutuals_count && event.mutuals_count > 0 && (
              <span className="flex items-center gap-1 text-xs text-primary font-medium ml-auto">
                <Users className="w-3 h-3" />
                {event.mutuals_count}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <Users className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">Sign in to see your social feed</h2>
          <Button onClick={() => navigate('/auth')} className="mt-4 gradient-warm text-primary-foreground">
            Sign In
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="px-4 h-14 flex items-center justify-between">
          <h1 className="font-display text-xl font-bold">Social</h1>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span>Trending</span>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6 pb-24">
        {/* Invite Code Entry */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <LinkIcon className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Have an invite code?</span>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Enter invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleInviteCode} variant="outline" size="sm">
              Join
            </Button>
          </div>
        </div>

        {/* Suggested Users */}
        {suggestedUsers.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm">People to Follow</h2>
              <button className="text-xs text-primary flex items-center gap-1">
                See All <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-3">
                {suggestedUsers.map((suggested) => (
                  <div
                    key={suggested.id}
                    className="flex-shrink-0 w-32 bg-card rounded-xl border border-border p-3 text-center"
                  >
                    <button onClick={() => handleUserClick(suggested.id)}>
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                        <span className="text-lg font-semibold text-primary">
                          {(suggested.nickname || suggested.name || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                    </button>
                    <p className="text-sm font-medium truncate">
                      {suggested.nickname || suggested.name || 'Student'}
                      {suggested.is_verified && <span className="text-primary ml-1">✓</span>}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{suggested.program}</p>
                    {(suggested.match_percentage ?? 0) > 0 && (
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-primary transition-all" 
                            style={{ width: `${suggested.match_percentage}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-primary">{suggested.match_percentage}%</span>
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant={followedIds.has(suggested.id) ? "outline" : "default"}
                      className="mt-2 w-full text-xs h-7"
                      onClick={() => followedIds.has(suggested.id) 
                        ? handleUnfollow(suggested.id) 
                        : handleFollow(suggested.id)
                      }
                    >
                      {followedIds.has(suggested.id) ? 'Following' : 'Follow'}
                    </Button>
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}

        {/* Friends Events */}
        {friendEvents.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                From People You Follow
              </h2>
            </div>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-3">
                {friendEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}

        {/* Category Rows */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          Object.entries(CATEGORY_GROUP_CONFIG).map(([groupKey, config]) => {
            const events = eventsByCategory[groupKey] || [];
            if (events.length === 0) return null;
            
            const Icon = config.icon;
            
            return (
              <div key={groupKey}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-sm flex items-center gap-2">
                    <Icon className="w-4 h-4 text-primary" />
                    {config.label}
                  </h2>
                  <button className="text-xs text-primary flex items-center gap-1">
                    See All <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <ScrollArea className="w-full whitespace-nowrap">
                  <div className="flex gap-3">
                    {events.map((event) => (
                      <EventCard key={event.id} event={event} compact />
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            );
          })
        )}

        {/* Empty State */}
        {!loading && friendEvents.length === 0 && Object.values(eventsByCategory).every(arr => arr.length === 0) && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-card rounded-2xl border border-border">
            {/* Animated illustration */}
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <PartyPopper className="w-10 h-10 text-primary" />
              </div>
              <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center border-2 border-background">
                <UtensilsCrossed className="w-4 h-4 text-orange-500" />
              </div>
              <div className="absolute -bottom-1 -left-1 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center border-2 border-background">
                <Dumbbell className="w-4 h-4 text-blue-500" />
              </div>
            </div>

            <h3 className="font-display text-xl font-bold mb-2">Your feed is quiet… for now</h3>
            <p className="text-muted-foreground text-sm max-w-xs mb-6">
              Follow other students and hosts to see their upcoming events mixed right into your feed.
            </p>

            {/* Action cards */}
            <div className="w-full grid grid-cols-2 gap-3 max-w-xs">
              <button
                onClick={() => navigate('/activities')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
              >
                <Palette className="w-6 h-6 text-primary" />
                <span className="text-xs font-medium">Discover Events</span>
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted border border-border hover:bg-muted/80 transition-colors"
              >
                <Handshake className="w-6 h-6 text-muted-foreground" />
                <span className="text-xs font-medium">Find People</span>
              </button>
            </div>

            {/* Suggested users hint */}
            {suggestedUsers.length > 0 && (
              <p className="mt-5 text-xs text-muted-foreground">
                👆 Scroll up to see suggested people to follow
              </p>
            )}
          </div>
        )}
      </div>

      {/* User Profile Sheet */}
      {selectedUserId && (
        <UserProfileSheet
          open={profileSheetOpen}
          onOpenChange={setProfileSheetOpen}
          userId={selectedUserId}
        />
      )}
    </AppLayout>
  );
};

export default Feed;
