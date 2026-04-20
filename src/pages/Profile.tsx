import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { APP_NAME } from '@/lib/constants';
import { SettingsSheet } from '@/components/SettingsSheet';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import FollowersSheet from '@/components/FollowersSheet';
import { 
  User, 
  Mail, 
  GraduationCap, 
  BookOpen, 
  MapPin,
  Settings,
  LogOut,
  Edit2,
  Check,
  X,
  ChevronRight,
  Shield,
  Users,
  Calendar,
  Phone,
  Eye,
  EyeOff,
  Instagram,
  ExternalLink,
  Camera
} from 'lucide-react';

const Profile = () => {
  const { user, profile, signOut, updateProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [followersSheetOpen, setFollowersSheetOpen] = useState(false);
  const [followersSheetTab, setFollowersSheetTab] = useState<'followers' | 'following'>('followers');
  const [editData, setEditData] = useState({
    nickname: profile?.nickname || '',
    bio: (profile as any)?.bio || '',
    program: profile?.program || '',
    location: profile?.location || '',
    phone_number: profile?.phone_number || '',
    is_public: profile?.is_public ?? true,
    instagram_handle: profile?.instagram_handle || '',
  });
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ followers: 0, following: 0, eventsAttended: 0, eventsHosted: 0 });

  useEffect(() => {
    if (profile) {
      fetchStats();
    }
  }, [profile]);

  const fetchStats = async () => {
    if (!profile) return;

    try {
      // Get follower count
      const { count: followerCount } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', profile.id);

      // Get following count
      const { count: followingCount } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', profile.id);

      // Get events attended count (past RSVPs that were confirmed)
      const { count: eventsCount } = await supabase
        .from('rsvps')
        .select('*, events!inner(date_time)', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('status', 'confirmed')
        .lt('events.date_time', new Date().toISOString());

      setStats({
        followers: followerCount || 0,
        following: followingCount || 0,
        eventsAttended: eventsCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please select an image file.',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Please select an image under 5MB.',
      });
      return;
    }

    setUploadingAvatar(true);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with avatar URL
      const { error: updateError } = await updateProfile({ avatar_url: publicUrl });

      if (updateError) throw updateError;

      toast({
        title: 'Avatar updated',
        description: 'Your profile picture has been updated.',
      });

      await refreshProfile();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: 'Failed to upload your avatar. Please try again.',
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleSave = async () => {
    setSaving(true);
    
    const { error } = await updateProfile({
      nickname: editData.nickname || null,
      bio: editData.bio || null,
      program: editData.program || null,
      location: editData.location || null,
      phone_number: editData.phone_number || null,
      is_public: editData.is_public,
      instagram_handle: editData.instagram_handle || null,
    } as any);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update profile.',
      });
    } else {
      toast({
        title: 'Profile updated',
        description: 'Your changes have been saved.',
      });
      setIsEditing(false);
      await refreshProfile();
    }

    setSaving(false);
  };

  if (!user || !profile) {
    return (
      <AppLayout>
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <User className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">Sign in to view your profile</h2>
          <Button 
            onClick={() => navigate('/auth')}
            className="mt-4 gradient-warm text-primary-foreground"
          >
            Sign In
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="font-display text-xl font-bold">Profile</h1>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsEditing(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleSave}
                  disabled={saving}
                >
                  <Check className="w-5 h-5" />
                </Button>
              </>
            ) : (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => {
                  setEditData({
                    nickname: profile?.nickname || '',
                    bio: (profile as any)?.bio || '',
                    program: profile?.program || '',
                    location: profile?.location || '',
                    phone_number: profile?.phone_number || '',
                    is_public: profile?.is_public ?? true,
                    instagram_handle: profile?.instagram_handle || '',
                  });
                  setIsEditing(true);
                }}
              >
                <Edit2 className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Profile Card */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-start gap-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="relative group"
            >
              <Avatar className="w-20 h-20 rounded-2xl">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.nickname || 'Profile'} className="object-cover" />
                <AvatarFallback className="w-20 h-20 rounded-2xl gradient-warm text-2xl font-bold text-primary-foreground">
                  {(profile.nickname || profile.name || 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {uploadingAvatar ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </div>
            </button>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-bold">
                  {profile.nickname || profile.name || 'Student'}
                </h2>
                {profile.is_verified && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>
              
              {profile.program && (
                <p className="text-sm text-muted-foreground mt-1">
                  {profile.program}
                </p>
              )}
              
              {profile.graduation_year && (
                <p className="text-sm text-muted-foreground">
                  Class of {profile.graduation_year}
                </p>
              )}
              
              {(profile as any)?.bio && (
                <p className="text-sm text-muted-foreground mt-2">
                  {(profile as any).bio}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="grid grid-cols-3 gap-4 text-center">
              <button 
                onClick={() => {
                  setFollowersSheetTab('followers');
                  setFollowersSheetOpen(true);
                }}
                className="hover:bg-muted/50 rounded-lg py-2 transition-colors"
              >
                <p className="font-display text-xl font-bold">{stats.followers}</p>
                <p className="text-xs text-muted-foreground">Followers</p>
              </button>
              <button 
                onClick={() => {
                  setFollowersSheetTab('following');
                  setFollowersSheetOpen(true);
                }}
                className="hover:bg-muted/50 rounded-lg py-2 transition-colors"
              >
                <p className="font-display text-xl font-bold">{stats.following}</p>
                <p className="text-xs text-muted-foreground">Following</p>
              </button>
              <div className="py-2">
                <p className="font-display text-xl font-bold">{stats.eventsAttended}</p>
                <p className="text-xs text-muted-foreground">Events</p>
              </div>
            </div>
          </div>

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Interests</p>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
                  <span 
                    key={interest}
                    className="px-3 py-1 rounded-full text-xs bg-secondary text-secondary-foreground"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Edit Form */}
        {isEditing && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4 animate-fade-in">
            <h3 className="font-semibold">Edit Profile</h3>
            
            <div className="space-y-2">
              <Label htmlFor="nickname">Name</Label>
              <Input
                id="nickname"
                value={editData.nickname}
                onChange={(e) => setEditData(prev => ({ ...prev, nickname: e.target.value }))}
                placeholder="Your name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Input
                id="bio"
                value={editData.bio}
                onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about yourself"
                maxLength={150}
              />
              <p className="text-xs text-muted-foreground">{editData.bio.length}/150</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="program">Program</Label>
              <Input
                id="program"
                value={editData.program}
                onChange={(e) => setEditData(prev => ({ ...prev, program: e.target.value }))}
                placeholder="What are you studying?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={editData.location}
                onChange={(e) => setEditData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Where are you based?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={editData.phone_number}
                onChange={(e) => setEditData(prev => ({ ...prev, phone_number: e.target.value }))}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <div className="relative">
                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="instagram"
                  value={editData.instagram_handle}
                  onChange={(e) => setEditData(prev => ({ ...prev, instagram_handle: e.target.value.replace('@', '') }))}
                  placeholder="username"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                {editData.is_public ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <Label htmlFor="is_public" className="cursor-pointer">
                  Public Profile
                </Label>
              </div>
              <Switch
                id="is_public"
                checked={editData.is_public}
                onCheckedChange={(checked) => setEditData(prev => ({ ...prev, is_public: checked }))}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {editData.is_public 
                ? 'Anyone can view your profile and follow you'
                : 'Only people you approve can follow you'}
            </p>
          </div>
        )}

        {/* Info Cards */}
        {!isEditing && (
          <div className="space-y-3">
            <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{user.email}</p>
              </div>
            </div>

            {profile.phone_number && (
              <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium">{profile.phone_number}</p>
                </div>
              </div>
            )}

            {profile.location && (
              <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-sm font-medium">{profile.location}</p>
                </div>
              </div>
            )}

            {profile.instagram_handle && (
              <a 
                href={`https://instagram.com/${profile.instagram_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 hover:border-primary/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                  <Instagram className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Instagram</p>
                  <p className="text-sm font-medium">@{profile.instagram_handle}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </a>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <SettingsSheet />

          <button 
            onClick={handleSignOut}
            className="w-full bg-card rounded-xl border border-border p-4 flex items-center gap-4 hover:border-destructive/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-destructive" />
            </div>
            <span className="flex-1 text-left font-medium text-destructive">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Followers Sheet */}
      {profile && (
        <FollowersSheet
          open={followersSheetOpen}
          onOpenChange={setFollowersSheetOpen}
          userId={profile.id}
          initialTab={followersSheetTab}
        />
      )}
    </AppLayout>
  );
};

export default Profile;