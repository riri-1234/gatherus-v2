import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/AppLayout';
import UserProfileSheet from '@/components/UserProfileSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Users, 
  Plus,
  Search,
  ChevronRight,
  UserPlus,
  UserCheck,
  Ticket,
} from 'lucide-react';

interface ActivityItem {
  id: string;
  user: {
    id: string;
    name: string | null;
    nickname: string | null;
    avatar_url: string | null;
    is_verified: boolean;
  };
  event: {
    id: string;
    title: string;
    date_time: string;
    category: string;
  };
  created_at: string;
}

interface PersonItem {
  id: string;
  name: string | null;
  nickname: string | null;
  avatar_url: string | null;
  program: string | null;
  is_verified: boolean;
  interests: string[];
  match_percentage?: number;
}

const Social = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [people, setPeople] = useState<PersonItem[]>([]);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      fetchAll();
    }
  }, [profile]);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchActivity(), fetchPeople(), fetchFollowed()]);
    setLoading(false);
  };

  const fetchFollowed = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', profile.id);
    if (data) setFollowedIds(new Set(data.map(f => f.following_id)));
  };

  const fetchActivity = async () => {
    if (!profile) return;
    
    // Get followed users
    const { data: follows } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', profile.id);
    
    if (!follows || follows.length === 0) {
      setActivities([]);
      return;
    }

    const followedIds = follows.map(f => f.following_id);

    // Get their RSVPs with event + user info
    const { data: rsvps } = await supabase
      .from('rsvps')
      .select(`
        id, created_at,
        user_id,
        event:events!rsvps_event_id_fkey(id, title, date_time, category)
      `)
      .in('user_id', followedIds)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false })
      .limit(30);

    if (!rsvps) {
      setActivities([]);
      return;
    }

    // Fetch profiles for these users
    const userIds = [...new Set(rsvps.map(r => r.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, nickname, avatar_url, is_verified')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    const activityItems: ActivityItem[] = rsvps
      .filter(r => r.event && profileMap.has(r.user_id))
      .map(r => ({
        id: r.id,
        user: profileMap.get(r.user_id)!,
        event: r.event as any,
        created_at: r.created_at,
      }));

    setActivities(activityItems);
  };

  const fetchPeople = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from('profiles')
      .select('id, name, nickname, avatar_url, program, is_verified, interests')
      .neq('id', profile.id)
      .limit(20);

    if (data) {
      // Score by interest overlap
      const scored = data.map(p => {
        const overlap = (p.interests || []).filter((i: string) => 
          (profile.interests || []).includes(i)
        ).length;
        return { ...p, match_percentage: Math.min(overlap * 20, 100) };
      }).sort((a, b) => b.match_percentage - a.match_percentage);
      
      setPeople(scored);
    }
  };

  const handleFollow = async (userId: string) => {
    if (!profile) return;
    await supabase.from('user_follows').insert({
      follower_id: profile.id,
      following_id: userId,
    });
    setFollowedIds(prev => new Set([...prev, userId]));
  };

  const handleUnfollow = async (userId: string) => {
    if (!profile) return;
    await supabase.from('user_follows')
      .delete()
      .eq('follower_id', profile.id)
      .eq('following_id', userId);
    setFollowedIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
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
    } else {
      setInviteCode('');
    }
  };

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setProfileSheetOpen(true);
  };

  const timeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const filteredPeople = searchQuery
    ? people.filter(p => 
        (p.nickname || p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.program || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : people;

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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowInviteInput(!showInviteInput)}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Invite code input */}
        {showInviteInput && (
          <div className="px-4 pb-3 flex gap-2 animate-fade-in">
            <div className="relative flex-1">
              <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Enter invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="pl-10"
                onKeyDown={(e) => e.key === 'Enter' && handleInviteCode()}
              />
            </div>
            <Button onClick={handleInviteCode} variant="outline" size="sm">
              Join
            </Button>
          </div>
        )}
      </header>

      <div className="p-4 pb-24">
        <Tabs defaultValue="feed" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="feed" className="flex-1">Activity</TabsTrigger>
            <TabsTrigger value="people" className="flex-1">People</TabsTrigger>
          </TabsList>

          {/* Activity Feed */}
          <TabsContent value="feed">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold mb-1">No activity yet</p>
                <p className="text-sm text-muted-foreground">Follow people to see what events they're attending</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="bg-card rounded-xl border border-border p-3">
                    <div className="flex items-start gap-3">
                      <button onClick={() => handleUserClick(activity.user.id)}>
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={activity.user.avatar_url || undefined} />
                          <AvatarFallback className="text-sm">
                            {(activity.user.nickname || activity.user.name || 'U')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <button 
                            onClick={() => handleUserClick(activity.user.id)}
                            className="font-semibold hover:text-primary transition-colors"
                          >
                            {activity.user.nickname || activity.user.name || 'Student'}
                            {activity.user.is_verified && <span className="text-primary ml-1">✓</span>}
                          </button>
                          {' '}is attending
                        </p>
                        <button
                          onClick={() => navigate(`/event/${activity.event.id}`)}
                          className="text-sm text-primary font-medium hover:underline truncate block"
                        >
                          {activity.event.title}
                        </button>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(activity.event.date_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          <span>·</span>
                          <span>{timeAgo(activity.created_at)}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/event/${activity.event.id}`)}
                        className="text-xs"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* People Directory */}
          <TabsContent value="people">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPeople.map((person) => {
                  const isFollowing = followedIds.has(person.id);
                  return (
                    <div key={person.id} className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
                      <button onClick={() => handleUserClick(person.id)}>
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={person.avatar_url || undefined} />
                          <AvatarFallback>
                            {(person.nickname || person.name || 'U')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {person.nickname || person.name || 'Student'}
                          {person.is_verified && <span className="text-primary ml-1">✓</span>}
                        </p>
                        {person.program && (
                          <p className="text-xs text-muted-foreground truncate">{person.program}</p>
                        )}
                        {person.match_percentage && person.match_percentage > 0 && (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="h-1 w-16 rounded-full bg-muted overflow-hidden">
                              <div 
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${person.match_percentage}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground">{person.match_percentage}% match</span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant={isFollowing ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => isFollowing ? handleUnfollow(person.id) : handleFollow(person.id)}
                        className="text-xs"
                      >
                        {isFollowing ? (
                          <><UserCheck className="w-3 h-3 mr-1" />Following</>
                        ) : (
                          <><UserPlus className="w-3 h-3 mr-1" />Follow</>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Profile Sheet */}
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

export default Social;
