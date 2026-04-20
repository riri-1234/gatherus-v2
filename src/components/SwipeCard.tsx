import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Calendar, MapPin, Users, Clock, X, Heart, Star, TrendingUp, UserPlus } from 'lucide-react';
import { CATEGORY_CONFIG } from '@/lib/constants';

interface EventData {
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

interface SwipeCardProps {
  event: EventData;
  onSwipe: (direction: 'left' | 'right') => void;
  onTap: () => void;
  onFollow?: (hostId: string) => void;
  isFirst?: boolean;
  friendsAttending?: number;
}

const SwipeCard = ({ event, onSwipe, onTap, onFollow, isFirst = false, friendsAttending = 0 }: SwipeCardProps) => {
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);
  const [showWiggle, setShowWiggle] = useState(isFirst);
  
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  
  const leftIndicatorOpacity = useTransform(x, [-100, -50, 0], [1, 0.5, 0]);
  const rightIndicatorOpacity = useTransform(x, [0, 50, 100], [0, 0.5, 1]);

  useEffect(() => {
    if (isFirst && showWiggle) {
      const timer = setTimeout(() => setShowWiggle(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isFirst, showWiggle]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    
    if (info.offset.x > threshold) {
      setExitDirection('right');
      onSwipe('right');
    } else if (info.offset.x < -threshold) {
      setExitDirection('left');
      onSwipe('left');
    }
  };

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFollow && event.host?.id) {
      onFollow(event.host.id);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getCapacityColor = () => {
    switch (event.capacity_status) {
      case 'open': return 'text-emerald-500';
      case 'filling': return 'text-amber-500';
      case 'full': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const categoryConfig = CATEGORY_CONFIG[event.category] || { label: event.category, color: 'bg-primary' };

  return (
    <motion.div
      className="absolute w-full cursor-grab active:cursor-grabbing"
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      onClick={onTap}
      animate={exitDirection ? {
        x: exitDirection === 'left' ? -500 : 500,
        opacity: 0,
        transition: { duration: 0.3 }
      } : showWiggle ? {
        x: [0, 50, -50, 30, -30, 0],
        transition: { duration: 1.5, ease: "easeInOut" }
      } : {}}
    >
      <div className="bg-card rounded-3xl overflow-hidden shadow-elevated border border-border mx-4">
        {/* Swipe Indicators */}
        <motion.div 
          className="absolute top-6 left-6 z-10 px-4 py-2 rounded-xl bg-red-500/90 text-white font-bold rotate-[-15deg]"
          style={{ opacity: leftIndicatorOpacity }}
        >
          <X className="w-6 h-6" />
        </motion.div>
        
        <motion.div 
          className="absolute top-6 right-6 z-10 px-4 py-2 rounded-xl bg-emerald-500/90 text-white font-bold rotate-[15deg]"
          style={{ opacity: rightIndicatorOpacity }}
        >
          <Heart className="w-6 h-6" />
        </motion.div>

        {/* Image */}
        <div className="relative h-64 bg-muted">
          {event.cover_image_url ? (
            <img 
              src={event.cover_image_url} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full gradient-warm opacity-50" />
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          
          {/* Top badges row */}
          <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
            <div className="flex flex-wrap gap-2">
              {/* Category Badge */}
              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold text-white ${categoryConfig.color}`}>
                {categoryConfig.label}
              </span>
              
              {/* Trending Badge */}
              {event.is_trending && (
                <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Trending
                </span>
              )}
            </div>

            {/* Access Type Badge */}
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
              event.access_type === 'open_rsvp' 
                ? 'bg-emerald-500/90 text-white' 
                : event.access_type === 'invite_only'
                ? 'bg-purple-500/90 text-white'
                : 'bg-amber-500/90 text-white'
            }`}>
              {event.access_type === 'open_rsvp' ? 'Open' : 
               event.access_type === 'invite_only' ? 'Invite Only' : 'Limited'}
            </span>
          </div>

          {/* Price badge */}
          {!event.is_free && event.price && (
            <div className="absolute bottom-4 right-4">
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-card/90 text-foreground">
                ${event.price}
              </span>
            </div>
          )}
          {event.is_free && (
            <div className="absolute bottom-4 right-4">
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/90 text-white">
                Free
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-2">
            <h2 className="font-display text-xl font-bold text-foreground line-clamp-2 flex-1">
              {event.title}
            </h2>
            {event.average_rating && event.average_rating > 0 && (
              <div className="flex items-center gap-1 ml-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-sm font-medium">{event.average_rating.toFixed(1)}</span>
              </div>
            )}
          </div>
          
          {event.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {event.description}
            </p>
          )}

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {event.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{formatDate(event.date_time)}</span>
              <Clock className="w-4 h-4 text-primary ml-2" />
              <span>{formatTime(event.date_time)}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="line-clamp-1">{event.location}</span>
              {event.is_on_campus && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                  On Campus
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-primary" />
              <span className={getCapacityColor()}>
                {event.current_attendees} going
                {event.capacity && ` · ${event.capacity - event.current_attendees} spots left`}
              </span>
              {friendsAttending > 0 && (
                <span className="text-xs text-primary font-medium">
                  +{friendsAttending} friends
                </span>
              )}
            </div>
          </div>

          {/* Host & School */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {(event.host?.nickname || event.host?.name || 'H')[0].toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium">
                  {event.host?.nickname || event.host?.name || 'Host'}
                  {event.host?.is_verified && (
                    <span className="ml-1 text-primary">✓</span>
                  )}
                </p>
              </div>
              
              {/* Follow button */}
              {onFollow && event.host?.id && (
                <button
                  onClick={handleFollowClick}
                  className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1"
                >
                  <UserPlus className="w-3 h-3" />
                  Follow
                </button>
              )}
            </div>
            
            {event.school && (
              <span className="text-xs text-muted-foreground">
                {event.school.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SwipeCard;