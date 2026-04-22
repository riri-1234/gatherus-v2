import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/AppLayout';
import UserProfileSheet from '@/components/UserProfileSheet';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, Search, ChevronRight, UserPlus, UserCheck, Loader2 } from 'lucide-react';

interface ActivityItem {
  id: string;
  user: { id: string; name: string | null; nickname: string | null; avatar_url: string | null; is_verified: boolean };
  event: { id: string; title: string; date_time: string; category: string };
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

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 14px 10px 38px', borderRadius: 14,
  border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
  color: '#f1f5f9', fontSize: 14, outline: 'none', fontFamily: 'inherit',
};

const Social = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [people, setPeople] = useState<PersonItem[]>([]);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [inviteError, setInviteError] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);

  const { profile, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (profile) { fetchAll(); } }, [profile]);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchActivity(), fetchPeople(), fetchFollowed()]);
    setLoading(false);
  };

  const fetchFollowed = async () => {
    if (!profile) return;
    const { data } = await supabase.from('user_follows').select('following_id').eq('follower_id', profile.id);
    if (data) setFollowedIds(new Set(data.map(f => f.following_id)));
  };

  const fetchActivity = async () => {
    if (!profile) return;
    const { data: follows } = await supabase.from('user_follows').select('following_id').eq('follower_id', profile.id);
    if (!follows || follows.length === 0) { setActivities([]); return; }
    const followedIds = follows.map(f => f.following_id);
    const { data: rsvps } = await supabase
      .from('rsvps').select('id, created_at, user_id, event:events!rsvps_event_id_fkey(id, title, date_time, category)')
      .in('user_id', followedIds).eq('status', 'confirmed').order('created_at', { ascending: false }).limit(30);
    if (!rsvps) { setActivities([]); return; }
    const userIds = [...new Set(rsvps.map(r => r.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('id, name, nickname, avatar_url, is_verified').in('id', userIds);
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    setActivities(rsvps.filter(r => r.event && profileMap.has(r.user_id)).map(r => ({ id: r.id, user: profileMap.get(r.user_id)!, event: r.event as any, created_at: r.created_at })));
  };

  const fetchPeople = async () => {
    if (!profile) return;
    const { data } = await supabase.from('profiles').select('id, name, nickname, avatar_url, program, is_verified, interests').neq('id', profile.id).limit(20);
    if (data) {
      const scored = data.map(p => {
        const overlap = (p.interests || []).filter((i: string) => (profile.interests || []).includes(i)).length;
        return { ...p, match_percentage: Math.min(overlap * 20, 100) };
      }).sort((a, b) => b.match_percentage - a.match_percentage);
      setPeople(scored);
    }
  };

  const handleFollow = async (userId: string) => {
    if (!profile) return;
    await supabase.from('user_follows').insert({ follower_id: profile.id, following_id: userId });
    setFollowedIds(prev => new Set([...prev, userId]));
  };

  const handleUnfollow = async (userId: string) => {
    if (!profile) return;
    await supabase.from('user_follows').delete().eq('follower_id', profile.id).eq('following_id', userId);
    setFollowedIds(prev => { const s = new Set(prev); s.delete(userId); return s; });
  };

  const handleInviteCode = async () => {
    if (!inviteCode.trim()) return;
    setInviteError(false);
    const { data } = await supabase.from('events').select('id').eq('invite_code', inviteCode.trim()).single();
    if (data) { navigate(`/event/${data.id}`); }
    else { setInviteError(true); setTimeout(() => setInviteError(false), 2000); }
  };

  const timeAgo = (d: string) => {
    const h = Math.floor((Date.now() - new Date(d).getTime()) / 3600000);
    if (h < 1) return 'just now';
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const filteredPeople = searchQuery
    ? people.filter(p => (p.nickname || p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (p.program || '').toLowerCase().includes(searchQuery.toLowerCase()))
    : people;

  if (!user) {
    return (
      <AppLayout>
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center gap-4">
          <div className="text-5xl">👥</div>
          <h2 className="font-bold text-white text-xl" style={{ fontFamily: "'Syne', sans-serif" }}>sign in to see your social feed</h2>
          <button onClick={() => navigate('/auth')} className="px-6 py-3 rounded-2xl font-bold text-white text-sm" style={{ background: 'linear-gradient(135deg,#7c3aed,#db2777)', border: 'none', cursor: 'pointer' }}>Sign In</button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <header className="sticky top-0 z-40" style={{ background: 'rgba(7,9,26,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="px-4 h-14 flex items-center justify-between">
          <h1 className="font-bold text-white text-xl" style={{ fontFamily: "'Syne', sans-serif" }}>social 👥</h1>
          <button onClick={() => setShowInviteInput(!showInviteInput)}
            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-lg"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#db2777)', border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px rgba(124,58,237,0.4)' }}>
            ＋
          </button>
        </div>

        {showInviteInput && (
          <div className="px-4 pb-3 flex gap-2">
            <input
              placeholder="🔐 enter invite code (e.g. GTHRUS-X7KP2M)"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleInviteCode()}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 14,
                border: `1.5px solid ${inviteError ? '#ef4444' : 'rgba(124,58,237,0.4)'}`,
                background: 'rgba(255,255,255,0.05)', color: '#c4b5fd',
                fontSize: 13, fontWeight: 600, outline: 'none',
                letterSpacing: '0.05em', fontFamily: 'inherit',
                animation: inviteError ? 'gatherShake .3s' : 'none',
              }}
            />
            <button onClick={handleInviteCode} className="px-4 py-2 rounded-xl text-sm font-bold text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg,#7c3aed,#db2777)', border: 'none', cursor: 'pointer' }}>Join</button>
          </div>
        )}
      </header>

      <div className="p-4 pb-24">
        <Tabs defaultValue="feed" className="w-full">
          <TabsList className="w-full mb-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14 }}>
            <TabsTrigger value="feed" className="flex-1 rounded-xl text-sm font-semibold data-[state=active]:text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Activity</TabsTrigger>
            <TabsTrigger value="people" className="flex-1 rounded-xl text-sm font-semibold data-[state=active]:text-white" style={{ fontFamily: "'Syne', sans-serif" }}>People</TabsTrigger>
          </TabsList>

          {/* ── Activity Feed ── */}
          <TabsContent value="feed">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#7c3aed' }} /></div>
            ) : activities.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">👋</div>
                <p className="font-bold text-white text-sm mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>no activity yet</p>
                <p className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>follow people to see what events they're attending</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {activities.map(a => (
                  <div key={a.id} className="rounded-2xl p-3 flex items-start gap-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <button onClick={() => { setSelectedUserId(a.user.id); setProfileSheetOpen(true); }}>
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={a.user.avatar_url || undefined} />
                        <AvatarFallback className="text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg,#7c3aed,#db2777)' }}>
                          {(a.user.nickname || a.user.name || 'U')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <button onClick={() => { setSelectedUserId(a.user.id); setProfileSheetOpen(true); }} className="font-bold text-white hover:text-purple-400 transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                          {a.user.nickname || a.user.name || 'Student'}
                          {a.user.is_verified && <span className="ml-1" style={{ color: '#a78bfa' }}>✓</span>}
                        </button>
                        <span className="ml-1" style={{ color: 'rgba(241,245,249,0.5)' }}>is attending</span>
                      </p>
                      <button onClick={() => navigate(`/event/${a.event.id}`)} className="text-sm font-semibold block truncate" style={{ color: '#c4b5fd', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
                        {a.event.title}
                      </button>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-3 h-3" style={{ color: 'rgba(241,245,249,0.35)' }} />
                        <span className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>
                          {new Date(a.event.date_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {timeAgo(a.created_at)}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => navigate(`/event/${a.event.id}`)} className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer', color: 'rgba(241,245,249,0.4)' }}>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── People ── */}
          <TabsContent value="people">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(241,245,249,0.35)' }} />
              <input placeholder="search people…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={inp} />
            </div>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#7c3aed' }} /></div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredPeople.map(p => {
                  const isFollowing = followedIds.has(p.id);
                  return (
                    <div key={p.id} className="rounded-2xl p-3 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <button onClick={() => { setSelectedUserId(p.id); setProfileSheetOpen(true); }}>
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={p.avatar_url || undefined} />
                          <AvatarFallback className="font-bold text-white" style={{ background: 'linear-gradient(135deg,#7c3aed,#db2777)' }}>
                            {(p.nickname || p.name || 'U')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-white truncate">
                          {p.nickname || p.name || 'Student'}
                          {p.is_verified && <span className="ml-1" style={{ color: '#a78bfa' }}>✓</span>}
                        </p>
                        {p.program && <p className="text-xs truncate" style={{ color: 'rgba(241,245,249,0.45)' }}>{p.program}</p>}
                        {p.match_percentage && p.match_percentage > 0 && (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="h-1 w-14 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                              <div className="h-full rounded-full" style={{ width: `${p.match_percentage}%`, background: 'linear-gradient(90deg,#7c3aed,#db2777)' }} />
                            </div>
                            <span className="text-[10px]" style={{ color: 'rgba(241,245,249,0.4)' }}>{p.match_percentage}% match</span>
                          </div>
                        )}
                      </div>
                      <button onClick={() => isFollowing ? handleUnfollow(p.id) : handleFollow(p.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all"
                        style={{ border: `1.5px solid ${isFollowing ? 'rgba(255,255,255,0.12)' : 'rgba(124,58,237,0.4)'}`, background: isFollowing ? 'transparent' : 'rgba(124,58,237,0.15)', color: isFollowing ? 'rgba(241,245,249,0.5)' : '#c4b5fd', cursor: 'pointer' }}>
                        {isFollowing ? <><UserCheck className="w-3 h-3" /> following</> : <><UserPlus className="w-3 h-3" /> follow</>}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {selectedUserId && (
        <UserProfileSheet open={profileSheetOpen} onOpenChange={setProfileSheetOpen} userId={selectedUserId} />
      )}
    </AppLayout>
  );
};

export default Social;
