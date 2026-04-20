
-- Add external_link column to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS external_link text;

-- Create storage bucket for event posters
INSERT INTO storage.buckets (id, name, public) VALUES ('event-posters', 'event-posters', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for event posters
CREATE POLICY "Anyone can view event posters" ON storage.objects
FOR SELECT USING (bucket_id = 'event-posters');

CREATE POLICY "Authenticated users can upload event posters" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'event-posters' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own event posters" ON storage.objects
FOR UPDATE USING (bucket_id = 'event-posters' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own event posters" ON storage.objects
FOR DELETE USING (bucket_id = 'event-posters' AND auth.uid()::text = (storage.foldername(name))[1]);
