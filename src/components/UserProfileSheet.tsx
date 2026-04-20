import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { 
  Instagram, 
  MapPin, 
  GraduationCap, 
  Users, 
  Calendar,
  Shield,
  UserPlus,
  UserCheck,
  ChevronRight,
  BookOpen,
  Heart
} from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  name: string | null;
  nickname: string | null;
  avatar_url: string | null;
  bio: string | null;
  program: string | null;
  graduation_year: number | null;
  instagram_handle: string | null;
  is_verified: boolean;
  location: string | null;
  school: {
    name: string;
  } | null;
}

interface UserStats {
  followers: number;
  following: number;
  eventsHosted: number;
  eventsAttended: number;
}

interface MutualProfile {
  id: string;
  name: string | null;
  nickname: string | null;
}

interface UserProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

const UserProfileSheet = ({ open, onOpenChange, userId }: UserProfileSheetProps) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats>({ followers: 0, following: 0, eventsHosted: 0, eventsAttended: 0 });
  const [matchPercentage, setMatchPercentage] = useState<number>(0);
  const [mutuals, setMutuals] = useState<MutualProfile[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const { profile: currentUserProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (open && userId) {
      fetchUserProfile();
    }
  }, [open, userId]);

  const fetchUserProfile = async () => {
    setLoading(true);
    
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select(`
          id, user_id, name, nickname, avatar_url, bio, program, 
          graduation_year, instagram_handle, is_verified, location,
          school:schools(name)
        `)
        .eq('id', userId)
        .single();

      if (profileData) {
        setUserProfile(profileData as UserProfile);
      }

      // Fetch stats
      const [followers, following, hosted, attended] = await Promise.all([
        supabase.from('user_follows').select('id', { count: 'exact' }).eq('following_id', userId),
        supabase.from('user_follows').select('id', { count: 'exact' }).eq('follower_id', userId),
        supabase.from('events').select('id', { count: 'exact' }).eq('host_id', userId),
        supabase.from('rsvps').select('id', { count: 'exact' }).eq('user_id', userId).eq('status', 'confirmed'),
      ]);

      setStats({
        followers: followers.count || 0,
        following: following.count || 0,
        eventsHosted: hosted.count || 0,
        eventsAttended: attended.count || 0,
      });

      // Check if current user follows this user + calculate match
      if (currentUserProfile) {
        const [followResult, matchResult] = await Promise.all([
          supabase
            .from('user_follows')
            .select('id')
            .eq('follower_id', currentUserProfile.id)
            .eq('following_id', userId)
            .maybeSingle(),
          supabase.rpc('calculate_match_percentage', {
            profile_a: currentUserProfile.id,
            profile_b: userId,
          }),
        ]);

        setIsFollowing(!!followResult.data);
        setMatchPercentage(matchResult.data ?? 0);

        // Get mutuals (people both users follow)
        const { data: myFollowing } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', currentUserProfile.id);

        if (myFollowing) {
          const myFollowingIds = myFollowing.map(f => f.following_id);
          
          const { data: theirFollowers } = await supabase
            .from('user_follows')
            .select('follower_id')
            .eq('following_id', userId);

          if (theirFollowers) {
            const mutualIds = theirFollowers
              .map(f => f.follower_id)
              .filter(id => myFollowingIds.includes(id));

            if (mutualIds.length > 0) {
              const { data: mutualProfiles } = await supabase
                .from('profiles')
                .select('id, name, nickname')
                .in('id', mutualIds.slice(0, 5));

              if (mutualProfiles) {
                setMutuals(mutualProfiles);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUserProfile) return;

    try {
      if (isFollowing) {
        await supabase.from('user_follows')
          .delete()
          .eq('follower_id', currentUserProfile.id)
          .eq('following_id', userId);
        setIsFollowing(false);
        setStats(prev => ({ ...prev, followers: prev.followers - 1 }));
      } else {
        await supabase.from('user_follows').insert({
          follower_id: currentUserProfile.id,
          following_id: userId,
        });
        setIsFollowing(true);
        setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleInstagramClick = () => {
    if (userProfile?.instagram_handle) {
      window.open(`https://instagram.com/${userProfile.instagram_handle.replace('@', '')}`, '_blank');
    }
  };

  if (loading) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="sr-only">User Profile</SheetTitle>
        </SheetHeader>

        {userProfile && (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                {userProfile.avatar_url ? (
                  <img src={userProfile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-primary">
                    {(userProfile.nickname || userProfile.name || 'U')[0].toUpperCase()}
                  </span>
                )}
              </div>
              <h2 className="font-display text-xl font-bold flex items-center justify-center gap-2">
                {userProfile.nickname || userProfile.name || 'Student'}
                {userProfile.is_verified && <Shield className="w-5 h-5 text-primary" />}
              </h2>
              {userProfile.school && (
                <p className="text-muted-foreground">{userProfile.school.name}</p>
              )}
              {userProfile.bio && (
                <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">{userProfile.bio}</p>
              )}
            </div>

            {/* Follow Button */}
            {currentUserProfile && currentUserProfile.id !== userId && (
              <Button 
                onClick={handleFollow}
                variant={isFollowing ? "outline" : "default"}
                className="w-full"
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-4 h-4 mr-2" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Follow
                  </>
                )}
              </Button>
            )}

            {/* Match Percentage */}
            {currentUserProfile && currentUserProfile.id !== userId && matchPercentage > 0 && (
              <div className="bg-card rounded-xl p-4 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">Event Match</span>
                  </div>
                  <span className="text-lg font-bold text-primary">{matchPercentage}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-primary transition-all duration-500" 
                    style={{ width: `${matchPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Based on shared events and common organizers
                </p>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-card rounded-xl p-3 border border-border">
                <p className="text-xl font-bold">{stats.followers}</p>
                <p className="text-xs text-muted-foreground">Followers</p>
              </div>
              <div className="bg-card rounded-xl p-3 border border-border">
                <p className="text-xl font-bold">{stats.following}</p>
                <p className="text-xs text-muted-foreground">Following</p>
              </div>
              <div className="bg-card rounded-xl p-3 border border-border">
                <p className="text-xl font-bold">{stats.eventsHosted}</p>
                <p className="text-xs text-muted-foreground">Hosted</p>
              </div>
              <div className="bg-card rounded-xl p-3 border border-border">
                <p className="text-xl font-bold">{stats.eventsAttended}</p>
                <p className="text-xs text-muted-foreground">Attended</p>
              </div>
            </div>

            {/* Mutuals */}
            {mutuals.length > 0 && (
              <div className="bg-card rounded-xl p-4 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">{mutuals.length} Mutual{mutuals.length > 1 ? 's' : ''}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {mutuals.map((mutual) => (
                    <div 
                      key={mutual.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm"
                    >
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                        {(mutual.nickname || mutual.name || 'U')[0].toUpperCase()}
                      </div>
                      <span>{mutual.nickname || mutual.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Details */}
            <div className="space-y-3">
              {userProfile.program && (
                <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
                  <BookOpen className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{userProfile.program}</p>
                    <p className="text-xs text-muted-foreground">Program</p>
                  </div>
                </div>
              )}

              {userProfile.graduation_year && (
                <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
                  <GraduationCap className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Class of {userProfile.graduation_year}</p>
                    <p className="text-xs text-muted-foreground">Graduation Year</p>
                  </div>
                </div>
              )}

              {userProfile.location && (
                <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{userProfile.location}</p>
                    <p className="text-xs text-muted-foreground">Campus</p>
                  </div>
                </div>
              )}

              {userProfile.instagram_handle && (
                <button 
                  onClick={handleInstagramClick}
                  className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border w-full hover:bg-muted/50 transition-colors"
                >
                  <Instagram className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">@{userProfile.instagram_handle.replace('@', '')}</p>
                    <p className="text-xs text-muted-foreground">Instagram</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default UserProfileSheet;
