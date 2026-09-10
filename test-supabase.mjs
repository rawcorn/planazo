import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xvzggauuglsqvawozrka.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2emdnYXV1Z2xzcXZhd296cmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3OTkzMTcsImV4cCI6MjA5NjM3NTMxN30.kzcQm6w9Ue9OZ2tzT8MIiOZfK3bMw8SpP79hYmSRki8'
const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey)

async function test() {
  const { data, error } = await supabase.from('dm_channels').select('*')
  console.log('Error dm_channels:', error)
  console.log('Data dm_channels:', JSON.stringify(data, null, 2))

  const { data: rooms, error: roomsErr } = await supabase.from('rooms').select('*')
  console.log('Error rooms:', roomsErr)
  console.log('Data rooms:', JSON.stringify(rooms, null, 2))
}

test()
