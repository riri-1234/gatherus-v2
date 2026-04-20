import { NavLink, useLocation } from 'react-router-dom';
import { Compass, Megaphone, Users, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const tabs = [
  { path: '/', icon: Compass, label: 'Discover' },
  { path: '/post', icon: Megaphone, label: 'Post' },
  { path: '/social', icon: Users, label: 'Social' },
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
              className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className={`relative ${isActive ? 'scale-110' : ''} transition-transform`}>
                {isProfile && profile?.avatar_url ? (
                  <Avatar className={`w-6 h-6 ${isActive ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}`}>
                    <AvatarImage src={profile.avatar_url} alt="Profile" className="object-cover" />
                    <AvatarFallback className="text-xs">
                      {(profile.nickname || profile.name || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Icon className="w-6 h-6" />
                )}
              </div>
              <span className="text-[10px] mt-0.5">{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
