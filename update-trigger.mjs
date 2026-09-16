import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xvzggauuglsqvawozrka.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2emdnYXV1Z2xzcXZhd296cmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3OTkzMTcsImV4cCI6MjA5NjM3NTMxN30.kzcQm6w9Ue9OZ2tzT8MIiOZfK3bMw8SpP79hYmSRki8'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { error } = await supabase.rpc('run_sql', { sql_query: `
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger AS $$
    BEGIN
      INSERT INTO public.users (id, username, email, age, gender, region, instagram, facebook, avatar_url)
      VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'username',
        NEW.email,
        (NEW.raw_user_meta_data->>'age')::integer,
        (NEW.raw_user_meta_data->>'gender')::public.gender_type,
        NEW.raw_user_meta_data->>'region',
        NEW.raw_user_meta_data->>'instagram',
        NEW.raw_user_meta_data->>'facebook',
        NEW.raw_user_meta_data->>'avatar_url'
      );
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `});
  console.log("Error updating trigger:", error);
}
run()
