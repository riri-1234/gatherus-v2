import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Image,
  Sparkles
} from 'lucide-react';
import { CATEGORIES, ACCESS_TYPES } from '@/lib/constants';

const Post = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    date: '',
    time: '',
    location: '',
    is_on_campus: true,
    capacity: '',
    access_type: 'open_rsvp',
  });

  if (!user || !profile) {
    return (
      <AppLayout>
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <Sparkles className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">Sign in to create events</h2>
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

  if (!profile.is_verified) {
    return (
      <AppLayout>
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <Sparkles className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">Complete your profile first</h2>
          <p className="text-muted-foreground mb-4">
            You need to be verified to create events
          </p>
          <Button 
            onClick={() => navigate('/onboarding')}
            className="gradient-warm text-primary-foreground"
          >
            Complete Profile
          </Button>
        </div>
      </AppLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category || !formData.date || !formData.time || !formData.location) {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
      });
      return;
    }

    setLoading(true);

    try {
      const dateTime = new Date(`${formData.date}T${formData.time}`).toISOString();

      const { error } = await supabase.from('events').insert({
        host_id: profile.id,
        title: formData.title,
        description: formData.description || null,
        category: formData.category as any,
        date_time: dateTime,
        location: formData.location,
        is_on_campus: formData.is_on_campus,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        access_type: formData.access_type as any,
        school_id: profile.school_id,
      });

      if (error) throw error;

      toast({
        title: 'Event created!',
        description: 'Your event is now live.',
      });
      
      navigate('/my-events');
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create event. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display text-xl font-bold">Create Event</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-6 pb-24">
        {/* Basic Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              placeholder="Give your event a catchy name"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Tell people what to expect..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>
        </div>

        {/* Date & Time */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            When
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Where
          </h3>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              placeholder="e.g., Robarts Library, Room 123"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, is_on_campus: true }))}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                formData.is_on_campus 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              On Campus
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, is_on_campus: false }))}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                !formData.is_on_campus 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              Off Campus
            </button>
          </div>
        </div>

        {/* Capacity & Access */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Attendance
          </h3>
          
          <div className="space-y-2">
            <Label htmlFor="capacity">Max Capacity (optional)</Label>
            <Input
              id="capacity"
              type="number"
              placeholder="Leave empty for unlimited"
              value={formData.capacity}
              onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
              min={1}
            />
          </div>

          <div className="space-y-2">
            <Label>Access Type</Label>
            <div className="space-y-2">
              {ACCESS_TYPES.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, access_type: type.value }))}
                  className={`w-full p-3 rounded-xl border text-left transition-all ${
                    formData.access_type === type.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  }`}
                >
                  <p className="font-medium text-sm">{type.label}</p>
                  <p className="text-xs text-muted-foreground">{type.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background border-t border-border">
          <Button 
            type="submit" 
            className="w-full gradient-warm text-primary-foreground"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Creating...
              </span>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Create Event
              </>
            )}
          </Button>
        </div>
      </form>
    </AppLayout>
  );
};

export default Post;
