import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xvzggauuglsqvawozrka.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2emdnYXV1Z2xzcXZhd296cmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3OTkzMTcsImV4cCI6MjA5NjM3NTMxN30.kzcQm6w9Ue9OZ2tzT8MIiOZfK3bMw8SpP79hYmSRki8'
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const username = 'testuser' + Date.now();
  const { data, error } = await supabase.auth.signUp({
    email: `${username}@planazo.local`,
    password: 'Password123!',
    options: {
      data: {
        username,
        age: 20,
        gender: 'X',
        region: 'CABA'
      }
    }
  });
  console.log(error || "Success");
}
test()
