import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://xvzggauuglsqvawozrka.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2emdnYXV1Z2xzcXZhd296cmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3OTkzMTcsImV4cCI6MjA5NjM3NTMxN30.kzcQm6w9Ue9OZ2tzT8MIiOZfK3bMw8SpP79hYmSRki8'
)

async function check() {
  const [users, regions, categories] = await Promise.all([
    supabase.from('users').select('id').limit(1),
    supabase.from('regions').select('id').limit(1),
    supabase.from('categories').select('id').limit(1)
  ])
  console.log('Users:', users.data?.length)
  console.log('Regions:', regions.data?.length)
  console.log('Categories:', categories.data?.length)
}
check()
