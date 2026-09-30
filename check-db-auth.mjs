import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xvzggauuglsqvawozrka.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2emdnYXV1Z2xzcXZhd296cmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3OTkzMTcsImV4cCI6MjA5NjM3NTMxN30.kzcQm6w9Ue9OZ2tzT8MIiOZfK3bMw8SpP79hYmSRki8'
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  // Use a fake signup to get a session
  const { data: authData, error: authError } = await supabase.auth.signUp({ email: 'test_check_regions@planazo.local', password: 'Password123!' })
  
  const [users, regions, categories] = await Promise.all([
    supabase.from('users').select('id').limit(1),
    supabase.from('regions').select('id').limit(1),
    supabase.from('interests').select('id').limit(1)
  ])
  console.log('Users:', users.data?.length)
  console.log('Regions:', regions.data?.length)
  console.log('Categories:', categories.data?.length)
}
check()
