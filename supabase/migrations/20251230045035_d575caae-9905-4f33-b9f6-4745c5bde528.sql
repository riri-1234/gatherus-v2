-- Create enums for school levels, event categories, access types, and RSVP statuses
CREATE TYPE public.school_level AS ENUM ('high_school', 'university');
CREATE TYPE public.event_category AS ENUM (
  'art_exhibition', 'book_club', 'lecture', 'garage_sale', 'study_session',
  'party', 'networking', 'cooking_class', 'food_exploration', 'car_meetup',
  'sports', 'creative_workshop', 'free_drinks', 'cafe_gathering', 'club_info_session'
);
CREATE TYPE public.event_access_type AS ENUM ('open_rsvp', 'limited_spots', 'approval_required', 'invite_only');
CREATE TYPE public.rsvp_status AS ENUM ('pending', 'confirmed', 'waitlist', 'cancelled');
CREATE TYPE public.capacity_status AS ENUM ('open', 'filling', 'full');

-- Schools table
CREATE TABLE public.schools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  level school_level NOT NULL,
  email_domain TEXT,
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Student profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  nickname TEXT,
  school_id UUID REFERENCES public.schools(id),
  graduation_year INTEGER,
  program TEXT,
  interests TEXT[] DEFAULT '{}',
  gender TEXT,
  sexuality TEXT,
  availability_weekday BOOLEAN DEFAULT true,
  availability_weekend BOOLEAN DEFAULT true,
  location TEXT,
  age INTEGER,
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  verification_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category event_category NOT NULL,
  date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  location_details TEXT,
  is_on_campus BOOLEAN DEFAULT true,
  capacity INTEGER,
  current_attendees INTEGER DEFAULT 0,
  access_type event_access_type DEFAULT 'open_rsvp',
  capacity_status capacity_status DEFAULT 'open',
  invite_code TEXT,
  cover_image_url TEXT,
  school_id UUID REFERENCES public.schools(id),
  visible_to_schools UUID[] DEFAULT '{}',
  event_rules TEXT,
  is_free BOOLEAN DEFAULT true,
  price DECIMAL(10,2),
  average_rating DECIMAL(2,1) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RSVPs table
CREATE TABLE public.rsvps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status rsvp_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Event swipes (for algorithm)
CREATE TABLE public.event_swipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  swiped_right BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- Event ratings
CREATE TABLE public.event_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  tags TEXT[] DEFAULT '{}',
  comment TEXT,
  attended BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_ratings ENABLE ROW LEVEL SECURITY;

-- Schools are publicly readable
CREATE POLICY "Schools are viewable by everyone" ON public.schools FOR SELECT USING (true);

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can create their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Events policies
CREATE POLICY "Events are viewable by everyone" ON public.events FOR SELECT USING (true);
CREATE POLICY "Verified users can create events" ON public.events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_verified = true)
);
CREATE POLICY "Hosts can update their events" ON public.events FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = events.host_id AND user_id = auth.uid())
);
CREATE POLICY "Hosts can delete their events" ON public.events FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = events.host_id AND user_id = auth.uid())
);

-- RSVPs policies
CREATE POLICY "Users can view RSVPs for events" ON public.rsvps FOR SELECT USING (true);
CREATE POLICY "Users can create their own RSVP" ON public.rsvps FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);
CREATE POLICY "Users can update their own RSVP" ON public.rsvps FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);
CREATE POLICY "Users can delete their own RSVP" ON public.rsvps FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);

-- Event swipes policies
CREATE POLICY "Users can view their own swipes" ON public.event_swipes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);
CREATE POLICY "Users can create their own swipes" ON public.event_swipes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);

-- Event ratings policies
CREATE POLICY "Ratings are viewable by everyone" ON public.event_ratings FOR SELECT USING (true);
CREATE POLICY "Users can create their own ratings" ON public.event_ratings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);
CREATE POLICY "Users can update their own ratings" ON public.event_ratings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rsvps_updated_at BEFORE UPDATE ON public.rsvps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, verification_email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'name', NEW.email);
  RETURN NEW;
END;
$$;

-- Trigger for auto profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert UofT as the first school
INSERT INTO public.schools (name, level, email_domain, city) VALUES
('University of Toronto', 'university', 'utoronto.ca', 'Toronto');