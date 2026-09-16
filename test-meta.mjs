import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xvzggauuglsqvawozrka.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2emdnYXV1Z2xzcXZhd296cmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3OTkzMTcsImV4cCI6MjA5NjM3NTMxN30.kzcQm6w9Ue9OZ2tzT8MIiOZfK3bMw8SpP79hYmSRki8'
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  await supabase.auth.signInWithPassword({ email: 'test_read@test.com', password: 'password123' });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  console.log("metadata:", user.user_metadata);
}
test()
