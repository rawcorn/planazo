import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xvzggauuglsqvawozrka.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2emdnYXV1Z2xzcXZhd296cmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3OTkzMTcsImV4cCI6MjA5NjM3NTMxN30.kzcQm6w9Ue9OZ2tzT8MIiOZfK3bMw8SpP79hYmSRki8'
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  await supabase.auth.signInWithPassword({ email: 'test_read@test.com', password: 'password123' });
  const { data } = await supabase.from('rooms').select('*').in('id', ['2097f2e3-abed-4d8c-8000-a06edbee08a2', '321a455d-f80a-41e7-b35f-a32aa465a97d', '9c8961c8-8dc0-4ff5-8925-ff76eb13bf00']);
  console.log(data);
}
test()
