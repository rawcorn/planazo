-- Drop everything first to ensure a clean slate (since we are pre-launch)
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.dm_channels CASCADE;
DROP TABLE IF EXISTS public.rooms CASCADE;
DROP TABLE IF EXISTS public.event_attendees CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.user_interests CASCADE;
DROP TABLE IF EXISTS public.interests CASCADE;
DROP TABLE IF EXISTS public.regions CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

DROP TYPE IF EXISTS public.message_type CASCADE;
DROP TYPE IF EXISTS public.room_type CASCADE;
DROP TYPE IF EXISTS public.gender_type CASCADE;

-- Create custom types (enums)
CREATE TYPE public.gender_type AS ENUM ('F', 'M', 'X');
CREATE TYPE public.room_type AS ENUM ('region', 'event', 'dm');
CREATE TYPE public.message_type AS ENUM ('text', 'system_event_created');

-- 1. Users Table
-- Extending auth.users (Supabase convention)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 18),
  gender public.gender_type NOT NULL,
  region TEXT NOT NULL,
  avatar_url TEXT,
  instagram TEXT,
  facebook TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Interests (Catalog)
CREATE TABLE public.interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL
);

-- Pre-populate interests
INSERT INTO public.interests (name) VALUES 
('Cine'), ('Bares'), ('Museos'), ('Picnic'), ('Running'), ('Cafés'), ('Gaming'), ('Lectura'), ('Música'), ('Teatro');

-- 3. User_Interests (M:N)
CREATE TABLE public.user_interests (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  interest_id UUID REFERENCES public.interests(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, interest_id)
);

-- 4. Regions (Catalog)
CREATE TABLE public.regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL
);

-- Pre-populate regions
INSERT INTO public.regions (name) VALUES 
('CABA'), ('GBA Norte'), ('GBA Sur'), ('GBA Oeste'), ('Córdoba'), ('Mendoza'), ('Rosario');

-- 5. Events (Planazos)
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  creator_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  region_id UUID REFERENCES public.regions(id) ON DELETE RESTRICT NOT NULL,
  category_id UUID REFERENCES public.interests(id) ON DELETE RESTRICT NOT NULL,
  event_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  address TEXT,
  max_attendees INTEGER,
  min_age INTEGER,
  max_age INTEGER,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Event_Attendees (M:N)
CREATE TABLE public.event_attendees (
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (event_id, user_id)
);

-- 7. Rooms
-- reference_id points to either a region id or an event id depending on type
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.room_type NOT NULL,
  reference_id UUID NOT NULL,
  UNIQUE(type, reference_id)
);

-- Auto-create rooms for existing regions
INSERT INTO public.rooms (type, reference_id) 
SELECT 'region', id FROM public.regions;

-- 7.5 DM Channels
CREATE TABLE public.dm_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user1_id, user2_id)
);

-- Trigger to auto-create room for DM
CREATE OR REPLACE FUNCTION public.handle_new_dm_room()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.rooms (type, reference_id) VALUES ('dm', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_dm_created_create_room
  AFTER INSERT ON public.dm_channels
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_dm_room();

-- 8. Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Nullable for system messages
  text TEXT,
  type public.message_type DEFAULT 'text' NOT NULL,
  event_reference_id UUID REFERENCES public.events(id) ON DELETE CASCADE, -- Only for system_event_created
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  deleted_by uuid[] DEFAULT '{}'::uuid[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_channels ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow read for authenticated" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON public.interests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON public.user_interests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON public.regions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON public.event_attendees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON public.rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON public.messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can access their DMs" ON public.dm_channels FOR SELECT TO authenticated USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users can create DMs" ON public.dm_channels FOR INSERT TO authenticated WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can manage own interests" ON public.user_interests FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert events" ON public.events FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update events" ON public.events FOR UPDATE TO authenticated USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete events" ON public.events FOR DELETE TO authenticated USING (auth.uid() = creator_id);

CREATE POLICY "Users can join events" ON public.event_attendees FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave events" ON public.event_attendees FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (
  (auth.uid() = sender_id OR sender_id IS NULL) AND (
    EXISTS (
      SELECT 1 FROM public.rooms r
      WHERE r.id = room_id AND r.type = 'region'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.rooms r
      WHERE r.id = room_id AND r.type = 'event' AND EXISTS (
        SELECT 1 FROM public.event_attendees ea 
        WHERE ea.event_id = r.reference_id AND ea.user_id = auth.uid()
      )
    )
    OR
    EXISTS (
      SELECT 1 FROM public.rooms r
      JOIN public.dm_channels dm ON dm.id = r.reference_id
      WHERE r.id = room_id AND r.type = 'dm' AND (dm.user1_id = auth.uid() OR dm.user2_id = auth.uid())
    )
  )
);

-- Triggers

-- 0. Profile creation on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, username, email, age, gender, region)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.email,
    (NEW.raw_user_meta_data->>'age')::integer,
    (NEW.raw_user_meta_data->>'gender')::public.gender_type,
    NEW.raw_user_meta_data->>'region'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 1. Create a room for a new event
CREATE OR REPLACE FUNCTION public.handle_new_event_room()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.rooms (type, reference_id) VALUES ('event', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_event_created_create_room
  AFTER INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_event_room();

-- 2. Automatically add creator as attendee
CREATE OR REPLACE FUNCTION public.handle_event_creator_attendee()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.event_attendees (event_id, user_id) VALUES (NEW.id, NEW.creator_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_event_created_add_creator
  AFTER INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.handle_event_creator_attendee();

-- 3. Send system message to region room when event is created
CREATE OR REPLACE FUNCTION public.handle_new_event_system_message()
RETURNS TRIGGER AS $$
DECLARE
  v_region_room_id UUID;
BEGIN
  SELECT id INTO v_region_room_id FROM public.rooms WHERE type = 'region' AND reference_id = NEW.region_id;
  
  IF v_region_room_id IS NOT NULL THEN
    INSERT INTO public.messages (room_id, sender_id, type, event_reference_id)
    VALUES (v_region_room_id, NULL, 'system_event_created', NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_event_created_send_message
  AFTER INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_event_system_message();

-- To allow Realtime to broadcast changes, we need to add the tables to the publication
alter publication supabase_realtime add table messages;

-- Storage Buckets & Policies
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('event_images', 'event_images', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
CREATE POLICY "Anyone can upload an avatar." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Anyone can update their avatar." ON storage.objects;
CREATE POLICY "Anyone can update their avatar." ON storage.objects FOR UPDATE WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Event images are publicly accessible." ON storage.objects;
CREATE POLICY "Event images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'event_images');

DROP POLICY IF EXISTS "Anyone can upload an event image." ON storage.objects;
CREATE POLICY "Anyone can upload an event image." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'event_images');

DROP POLICY IF EXISTS "Anyone can update event images." ON storage.objects;
CREATE POLICY "Anyone can update event images." ON storage.objects FOR UPDATE WITH CHECK (bucket_id = 'event_images');
