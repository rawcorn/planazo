import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xvzggauuglsqvawozrka.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2emdnYXV1Z2xzcXZhd296cmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3OTkzMTcsImV4cCI6MjA5NjM3NTMxN30.kzcQm6w9Ue9OZ2tzT8MIiOZfK3bMw8SpP79hYmSRki8'
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data: auth, error: err } = await supabase.auth.signInWithPassword({
    email: 'test_read@test.com',
    password: 'password123'
  });
  if (err) {
    console.log('Login error:', err);
    return;
  }
  
  const { data, error } = await supabase.from('messages').select('room_id, text, created_at, sender_id').order('created_at', { ascending: false }).limit(5);
  console.log(data);
}
test()
