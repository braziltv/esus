-- Add column to store cached audio URL
ALTER TABLE public.scheduled_announcements
ADD COLUMN audio_cache_url TEXT,
ADD COLUMN audio_generated_at TIMESTAMP WITH TIME ZONE;