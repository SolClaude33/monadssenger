-- Create messages table for public chat
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room TEXT NOT NULL DEFAULT 'lobby',
  username TEXT NOT NULL,
  user_color TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create typing_indicators table
CREATE TABLE IF NOT EXISTS public.typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room TEXT NOT NULL,
  username TEXT NOT NULL,
  user_color TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(room, username)
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read messages (public chat)
CREATE POLICY "messages_select_all"
  ON public.messages FOR SELECT
  USING (true);

-- Allow anyone to insert messages (public chat)
CREATE POLICY "messages_insert_all"
  ON public.messages FOR INSERT
  WITH CHECK (true);

-- Allow anyone to read typing indicators
CREATE POLICY "typing_select_all"
  ON public.typing_indicators FOR SELECT
  USING (true);

-- Allow anyone to insert/update typing indicators
CREATE POLICY "typing_insert_all"
  ON public.typing_indicators FOR INSERT
  WITH CHECK (true);

CREATE POLICY "typing_update_all"
  ON public.typing_indicators FOR UPDATE
  USING (true);

CREATE POLICY "typing_delete_all"
  ON public.typing_indicators FOR DELETE
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS messages_room_created_at_idx ON public.messages(room, created_at DESC);
CREATE INDEX IF NOT EXISTS typing_room_updated_at_idx ON public.typing_indicators(room, updated_at DESC);

-- Auto-delete old typing indicators (older than 10 seconds)
CREATE OR REPLACE FUNCTION delete_old_typing_indicators()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.typing_indicators
  WHERE updated_at < NOW() - INTERVAL '10 seconds';
END;
$$;

-- Note: This script is for PostgreSQL direct (Railway, etc.)
-- RLS (Row Level Security) is enabled but policies allow public access
-- For production, you may want to restrict access based on your needs
