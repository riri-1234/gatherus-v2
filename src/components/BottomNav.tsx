import { NavLink, useLocation } from 'react-router-dom';
import { PartyPopper, CalendarDays, Plus, Users, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const tabs = [
  { path: '/', icon: PartyPopper, label: 'Activities' },
  { path: '/my-events', icon: CalendarDays, label: 'My Events' },
  { path: '/post', icon: Plus, label: 'Post' },
  { path: '/feed', icon: Users, label: 'Social' },
  { path: '/profile', icon: User, label: 'Profile' },
];

const BottomNav = () => {
  const location = useLocation();
  const { profile } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto pt-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          const isProfile = tab.path === '/profile';
          
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={`flex items-center justify-center w-14 h-full transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className={`relative ${isActive ? 'scale-110' : ''} transition-transform`}>
                {tab.path === '/post' ? (
                  <div className="w-11 h-11 -mt-4 rounded-full gradient-warm flex items-center justify-center shadow-glow">
                    <Icon className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
                  </div>
                ) : isProfile && profile?.avatar_url ? (
                  <>
                    <Avatar className={`w-6 h-6 ${isActive ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}`}>
                      <AvatarImage src={profile.avatar_url} alt="Profile" className="object-cover" />
                      <AvatarFallback className="text-xs">
                        {(profile.nickname || profile.name || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </>
                ) : (
                  <>
                    <Icon className="w-6 h-6" />
                  </>
                )}
              </div>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
