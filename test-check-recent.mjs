import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xvzggauuglsqvawozrka.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2emdnYXV1Z2xzcXZhd296cmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3OTkzMTcsImV4cCI6MjA5NjM3NTMxN30.kzcQm6w9Ue9OZ2tzT8MIiOZfK3bMw8SpP79hYmSRki8'
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const email = `test_read2_${Date.now()}@test.com`
  await supabase.auth.signUp({
    email, password: 'password123',
    options: { data: { username: 'test', age: 25, gender: 'X', region: 'CABA' } }
  });

  const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(5);
  console.log('Error:', error);
  console.log('Data count:', data?.length);
  if (data?.length > 0) {
    data.forEach(m => console.log(m.created_at, m.text, m.sender_id));
  }
}
test()
