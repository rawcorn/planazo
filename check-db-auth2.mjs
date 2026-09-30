import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xvzggauuglsqvawozrka.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2emdnYXV1Z2xzcXZhd296cmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3OTkzMTcsImV4cCI6MjA5NjM3NTMxN30.kzcQm6w9Ue9OZ2tzT8MIiOZfK3bMw8SpP79hYmSRki8'
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data: authData, error: authError } = await supabase.auth.signUp({ email: 'test_check_regions2@planazo.local', password: 'Password123!', options: { data: { username: 'test', age: 20, gender: 'X', region: 'CABA' } } })
  console.log('Auth:', authError || 'Success', authData.user?.id)
  
  const regions = await supabase.from('regions').select('id')
  console.log('Regions count:', regions.data?.length)
}
check()
