import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://xvzggauuglsqvawozrka.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2emdnYXV1Z2xzcXZhd296cmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3OTkzMTcsImV4cCI6MjA5NjM3NTMxN30.kzcQm6w9Ue9OZ2tzT8MIiOZfK3bMw8SpP79hYmSRki8'
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  await supabase.auth.signInWithPassword({ email: 'test_check_regions2@planazo.local', password: 'Password123!' })
  
  // Try to insert an event to see the exact error
  const res = await supabase.from('events').insert({
    title: 'Test',
    description: 'Test',
    region_id: '4f697c97-758f-40f6-91d6-0532e6eeace8', // CABA
    category_id: '952c21db-e1d4-46c9-953e-ea568bc6b732', // Cine
    event_datetime: new Date().toISOString(),
    creator_id: (await supabase.auth.getUser()).data.user.id
  })
  console.log(res.error)
}
check()
