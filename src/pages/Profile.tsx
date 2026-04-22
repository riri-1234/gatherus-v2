import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/hooks/use-toast';
import { SettingsSheet } from '@/components/SettingsSheet';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import FollowersSheet from '@/components/FollowersSheet';
import { Switch } from '@/components/ui/switch';
import {
  User, Mail, MapPin, Settings, LogOut, Edit2, Check, X,
  ChevronRight, Shield, Users, Calendar, Phone, Eye, EyeOff,
  Instagram, ExternalLink, Camera, Loader2,
} from 'lucide-react';

const inp: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 14,
  border: '1.5px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.05)', color: '#f1f5f9',
  fontSize: 14, outline: 'none', transition: 'border-color .2s', fontFamily: 'inherit',
};
const lbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: 'rgba(241,245,249,0.5)',
  display: 'block', marginBottom: 6,
};

const Profile = () => {
  const { user, profile, signOut, updateProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [followersSheetOpen, setFollowersSheetOpen] = useState(false);
  const [followersSheetTab, setFollowersSheetTab] = useState<'followers' | 'following'>('followers');
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ followers: 0, following: 0, eventsAttended: 0, eventsHosted: 0 });
  const [editData, setEditData] = useState({
    nickname: '', bio: '', program: '', location: '',
    phone_number: '', is_public: true, instagram_handle: '',
  });

  useEffect(() => {
    if (profile) {
      fetchStats();
      setEditData({
        nickname: profile.nickname || '',
        bio: (profile as any)?.bio || '',
        program: profile.program || '',
        location: profile.location || '',
        phone_number: profile.phone_number || '',
        is_public: profile.is_public ?? true,
        instagram_handle: profile.instagram_handle || '',
      });
    }
  }, [profile]);

  const fetchStats = async () => {
    if (!profile) return;
    try {
      const [f1, f2, f3, f4] = await Promise.all([
        supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
        supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
        supabase.from('rsvps').select('*, events!inner(date_time)', { count: 'exact', head: true }).eq('user_id', profile.id).eq('status', 'confirmed').lt('events.date_time', new Date().toISOString()),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('host_id', profile.id),
      ]);
      setStats({ followers: f1.count || 0, following: f2.count || 0, eventsAttended: f3.count || 0, eventsHosted: f4.count || 0 });
    } catch (err) { console.error(err); }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) { toast({ variant: 'destructive', title: 'Invalid file type', description: 'Please select an image file.' }); return; }
    if (file.size > 5 * 1024 * 1024) { toast({ variant: 'destructive', title: 'File too large', description: 'Please select an image under 5MB.' }); return; }
    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const { error: updateError } = await updateProfile({ avatar_url: publicUrl });
      if (updateError) throw updateError;
      toast({ title: 'Avatar updated', description: 'Your profile picture has been updated.' });
      await refreshProfile();
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Upload failed', description: 'Failed to upload your avatar. Please try again.' });
    } finally { setUploadingAvatar(false); }
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
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update profile.' });
    } else {
      toast({ title: 'Profile updated ✨', description: 'Your changes have been saved.' });
      setIsEditing(false);
      await refreshProfile();
    }
    setSaving(false);
  };

  const handleSignOut = async () => { await signOut(); navigate('/auth'); };

  const focus = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = '#7c3aed');
  const blur = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)');

  if (!user || !profile) {
    return (
      <AppLayout>
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center gap-4">
          <div className="text-5xl">👤</div>
          <h2 className="font-bold text-white text-xl" style={{ fontFamily: "'Syne', sans-serif" }}>Sign in to view your profile</h2>
          <button onClick={() => navigate('/auth')} className="px-6 py-3 rounded-2xl font-bold text-white text-sm" style={{ background: 'linear-gradient(135deg,#7c3aed,#db2777)', border: 'none', cursor: 'pointer' }}>Sign In</button>
        </div>
      </AppLayout>
    );
  }

  const statItems = [
    { v: stats.followers, l: 'Followers', action: () => { setFollowersSheetTab('followers'); setFollowersSheetOpen(true); } },
    { v: stats.following, l: 'Following', action: () => { setFollowersSheetTab('following'); setFollowersSheetOpen(true); } },
    { v: stats.eventsAttended, l: 'Attended', action: null },
    { v: stats.eventsHosted, l: 'Hosted', action: null },
  ];

  const infoRows = [
    { icon: Mail, label: 'Email', value: user.email },
    profile.phone_number ? { icon: Phone, label: 'Phone', value: profile.phone_number } : null,
    profile.location ? { icon: MapPin, label: 'Location', value: profile.location } : null,
  ].filter(Boolean) as { icon: any; label: string; value: string }[];

  return (
    <AppLayout>
      {/* Header */}
      <header className="sticky top-0 z-40" style={{ background: 'rgba(7,9,26,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="font-bold text-white text-xl" style={{ fontFamily: "'Syne', sans-serif" }}>profile 👤</h1>
          <div className="flex items-center gap-1">
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer', color: 'rgba(241,245,249,0.6)' }}><X className="w-4 h-4" /></button>
                <button onClick={handleSave} disabled={saving} className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#7c3aed,#db2777)', border: 'none', cursor: 'pointer', color: '#fff' }}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer', color: 'rgba(241,245,249,0.6)' }}>
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="p-4 pb-28 flex flex-col gap-4">

        {/* ── Profile card ── */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 20 }}>
          <div className="flex items-start gap-4">
            {/* Avatar with upload */}
            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar} className="relative group flex-shrink-0">
              <Avatar className="w-20 h-20 rounded-2xl">
                <AvatarImage src={profile.avatar_url || undefined} className="object-cover" />
                <AvatarFallback className="w-20 h-20 rounded-2xl text-2xl font-bold text-white" style={{ background: 'linear-gradient(135deg,#7c3aed,#db2777)' }}>
                  {(profile.nickname || profile.name || 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {uploadingAvatar ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
              </div>
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-white text-xl" style={{ fontFamily: "'Syne', sans-serif" }}>
                  {profile.nickname || profile.name || 'Student'}
                </h2>
                {profile.is_verified && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)' }}>
                    <Shield className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              {profile.program && <p className="text-sm mt-0.5" style={{ color: 'rgba(241,245,249,0.5)' }}>{profile.program}</p>}
              {profile.graduation_year && <p className="text-xs mt-0.5" style={{ color: 'rgba(241,245,249,0.4)' }}>Class of {profile.graduation_year}</p>}
              {(profile as any)?.bio && <p className="text-sm mt-2" style={{ color: 'rgba(241,245,249,0.55)', lineHeight: 1.4 }}>{(profile as any).bio}</p>}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-5 pt-4 grid grid-cols-4 gap-1" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {statItems.map(s => (
              <button key={s.l} onClick={s.action || undefined} className="rounded-xl py-2 text-center transition-colors" style={{ background: 'none', border: 'none', cursor: s.action ? 'pointer' : 'default' }}
                onMouseEnter={e => s.action && ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)')}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'none')}>
                <p className="font-bold text-white text-xl" style={{ fontFamily: "'Syne', sans-serif" }}>{s.v}</p>
                <p className="text-[10px]" style={{ color: 'rgba(241,245,249,0.4)' }}>{s.l}</p>
              </button>
            ))}
          </div>

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs mb-2" style={{ color: 'rgba(241,245,249,0.4)' }}>interests</p>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map(interest => (
                  <span key={interest} className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)', color: '#c4b5fd' }}>
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Edit form ── */}
        {isEditing && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 20 }}>
            <h3 className="font-bold text-white text-sm mb-5" style={{ fontFamily: "'Syne', sans-serif" }}>edit profile</h3>
            <div className="flex flex-col gap-4">
              <div><label style={lbl}>name</label><input style={inp} value={editData.nickname} onChange={e=>setEditData(p=>({...p,nickname:e.target.value}))} placeholder="Your name" onFocus={focus} onBlur={blur}/></div>
              <div>
                <label style={lbl}>bio <span style={{ color: 'rgba(241,245,249,0.3)' }}>({editData.bio.length}/150)</span></label>
                <input style={inp} value={editData.bio} onChange={e=>setEditData(p=>({...p,bio:e.target.value}))} placeholder="Tell us about yourself" maxLength={150} onFocus={focus} onBlur={blur}/>
              </div>
              <div><label style={lbl}>program</label><input style={inp} value={editData.program} onChange={e=>setEditData(p=>({...p,program:e.target.value}))} placeholder="What are you studying?" onFocus={focus} onBlur={blur}/></div>
              <div><label style={lbl}>location</label><input style={inp} value={editData.location} onChange={e=>setEditData(p=>({...p,location:e.target.value}))} placeholder="Where are you based?" onFocus={focus} onBlur={blur}/></div>
              <div><label style={lbl}>phone</label><input type="tel" style={inp} value={editData.phone_number} onChange={e=>setEditData(p=>({...p,phone_number:e.target.value}))} placeholder="+1 (416) 123-4567" onFocus={focus} onBlur={blur}/></div>
              <div>
                <label style={lbl}>instagram</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'rgba(241,245,249,0.4)' }}>@</span>
                  <input style={{...inp,paddingLeft:28}} value={editData.instagram_handle} onChange={e=>setEditData(p=>({...p,instagram_handle:e.target.value.replace('@','')}))} placeholder="username" onFocus={focus} onBlur={blur}/>
                </div>
              </div>
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  {editData.is_public ? <Eye className="w-4 h-4" style={{ color: '#a78bfa' }} /> : <EyeOff className="w-4 h-4" style={{ color: 'rgba(241,245,249,0.4)' }} />}
                  <span className="text-sm text-white">public profile</span>
                </div>
                <Switch checked={editData.is_public} onCheckedChange={v=>setEditData(p=>({...p,is_public:v}))} />
              </div>
              <p className="text-xs" style={{ color: 'rgba(241,245,249,0.35)' }}>
                {editData.is_public ? 'anyone can view your profile and follow you' : 'only people you approve can follow you'}
              </p>
            </div>
          </div>
        )}

        {/* ── Info cards ── */}
        {!isEditing && (
          <div className="flex flex-col gap-2">
            {infoRows.map(row => (
              <div key={row.label} className="flex items-center gap-3 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(124,58,237,0.15)' }}>
                  <row.icon className="w-4 h-4" style={{ color: '#a78bfa' }} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>{row.label}</p>
                  <p className="text-sm font-medium text-white">{row.value}</p>
                </div>
              </div>
            ))}
            {profile.instagram_handle && (
              <a href={`https://instagram.com/${profile.instagram_handle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl p-4 transition-colors" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', textDecoration: 'none' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#8b5cf6,#ec4899,#f97316)' }}>
                  <Instagram className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>Instagram</p>
                  <p className="text-sm font-medium text-white">@{profile.instagram_handle}</p>
                </div>
                <ExternalLink className="w-4 h-4" style={{ color: 'rgba(241,245,249,0.3)' }} />
              </a>
            )}
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex flex-col gap-2">
          <SettingsSheet />
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 rounded-2xl p-4 transition-colors text-left" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239,68,68,0.15)' }}>
              <LogOut className="w-4 h-4" style={{ color: '#ef4444' }} />
            </div>
            <span className="font-semibold text-sm" style={{ color: '#ef4444' }}>Sign Out</span>
          </button>
        </div>
      </div>

      {profile && (
        <FollowersSheet open={followersSheetOpen} onOpenChange={setFollowersSheetOpen} userId={profile.id} initialTab={followersSheetTab} />
      )}
    </AppLayout>
  );
};

export default Profile;
