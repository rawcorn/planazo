import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xvzggauuglsqvawozrka.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2emdnYXV1Z2xzcXZhd296cmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3OTkzMTcsImV4cCI6MjA5NjM3NTMxN30.kzcQm6w9Ue9OZ2tzT8MIiOZfK3bMw8SpP79hYmSRki8'
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  await supabase.auth.signInWithPassword({ email: 'test_check_regions2@planazo.local', password: 'Password123!' })
  
  // Create an event with each region to see if any fail
  const regions = [
    '4f697c97-758f-40f6-91d6-0532e6eeace8',
    'b490978c-d607-48ba-8b21-5c1ce3108c54',
    '308b1ab3-ae4d-4974-a378-c0465b578e11',
    '3d31f36e-1ff9-4cf6-93f5-92d3ace79190',
    'b4db82e9-98cc-4b8d-ae75-cfcd9c3c2401',
    '610a4050-fc55-48cc-8cd6-830fe0bef435',
    '47909995-8090-4141-9354-00010a911e77'
  ]

  for (const r of regions) {
    const res = await supabase.from('events').insert({
      title: 'Test',
      description: 'Test',
      region_id: r,
      category_id: '952c21db-e1d4-46c9-953e-ea568bc6b732',
      event_datetime: new Date().toISOString(),
      creator_id: (await supabase.auth.getUser()).data.user.id
    })
    console.log(r, res.error ? res.error.message : 'Success')
  }
}
check()
