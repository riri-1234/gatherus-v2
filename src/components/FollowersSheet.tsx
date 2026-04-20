import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserMinus, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface FollowUser {
  id: string;
  name: string | null;
  nickname: string | null;
  avatar_url: string | null;
  program: string | null;
}

interface FollowersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  initialTab?: 'followers' | 'following';
}

const FollowersSheet = ({ open, onOpenChange, userId, initialTab = 'followers' }: FollowersSheetProps) => {
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const { profile: currentUserProfile } = useAuth();

  useEffect(() => {
    if (open && userId) {
      fetchFollowData();
    }
  }, [open, userId]);

  const fetchFollowData = async () => {
    setLoading(true);
    try {
      // Fetch followers
      const { data: followerData } = await supabase
        .from('user_follows')
        .select('follower_id')
        .eq('following_id', userId);

      if (followerData && followerData.length > 0) {
        const followerIds = followerData.map(f => f.follower_id);
        const { data: followerProfiles } = await supabase
          .from('profiles')
          .select('id, name, nickname, avatar_url, program')
          .in('id', followerIds);
        
        if (followerProfiles) {
          setFollowers(followerProfiles);
        }
      } else {
        setFollowers([]);
      }

      // Fetch following
      const { data: followingData } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', userId);

      if (followingData && followingData.length > 0) {
        const followingIdsList = followingData.map(f => f.following_id);
        const { data: followingProfiles } = await supabase
          .from('profiles')
          .select('id, name, nickname, avatar_url, program')
          .in('id', followingIdsList);
        
        if (followingProfiles) {
          setFollowing(followingProfiles);
        }
      } else {
        setFollowing([]);
      }

      // Get current user's following list for follow/unfollow buttons
      if (currentUserProfile) {
        const { data: myFollowing } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', currentUserProfile.id);
        
        if (myFollowing) {
          setFollowingIds(new Set(myFollowing.map(f => f.following_id)));
        }
      }
    } catch (error) {
      console.error('Error fetching follow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (targetUserId: string) => {
    if (!currentUserProfile) return;

    try {
      if (followingIds.has(targetUserId)) {
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', currentUserProfile.id)
          .eq('following_id', targetUserId);
        
        setFollowingIds(prev => {
          const next = new Set(prev);
          next.delete(targetUserId);
          return next;
        });
      } else {
        await supabase
          .from('user_follows')
          .insert({
            follower_id: currentUserProfile.id,
            following_id: targetUserId,
          });
        
        setFollowingIds(prev => new Set(prev).add(targetUserId));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const UserCard = ({ user }: { user: FollowUser }) => {
    const isCurrentUser = currentUserProfile?.id === user.id;
    const isFollowing = followingIds.has(user.id);

    return (
      <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
        <Avatar className="w-12 h-12">
          <AvatarImage src={user.avatar_url || undefined} alt={user.nickname || user.name || 'User'} className="object-cover" />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {(user.nickname || user.name || 'U')[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{user.nickname || user.name || 'Student'}</p>
          {user.program && (
            <p className="text-sm text-muted-foreground truncate">{user.program}</p>
          )}
        </div>
        {!isCurrentUser && (
          <Button
            variant={isFollowing ? 'outline' : 'default'}
            size="sm"
            onClick={() => handleFollowToggle(user.id)}
            className="shrink-0"
          >
            {isFollowing ? (
              <>
                <UserMinus className="w-4 h-4 mr-1" />
                Unfollow
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-1" />
                Follow
              </>
            )}
          </Button>
        )}
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
        <SheetHeader className="pb-2">
          <SheetTitle>Connections</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue={initialTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="followers">Followers ({followers.length})</TabsTrigger>
            <TabsTrigger value="following">Following ({following.length})</TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <TabsContent value="followers" className="mt-4 max-h-[calc(70vh-140px)] overflow-y-auto">
                {followers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No followers yet</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {followers.map(user => (
                      <UserCard key={user.id} user={user} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="following" className="mt-4 max-h-[calc(70vh-140px)] overflow-y-auto">
                {following.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Not following anyone yet</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {following.map(user => (
                      <UserCard key={user.id} user={user} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default FollowersSheet;