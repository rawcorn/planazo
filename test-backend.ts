/* eslint-disable */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xvzggauuglsqvawozrka.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2emdnYXV1Z2xzcXZhd296cmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3OTkzMTcsImV4cCI6MjA5NjM3NTMxN30.kzcQm6w9Ue9OZ2tzT8MIiOZfK3bMw8SpP79hYmSRki8'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function runTests() {
  console.log('--- Empezando Tests de Verificación ---')

  const emailA = `testA_${Date.now()}@test.com`
  const { data: userA, error: errA } = await supabase.auth.signUp({
    email: emailA,
    password: 'password123',
    options: {
      data: {
        username: `userA_${Date.now()}`,
        age: 25,
        gender: 'F',
        region: 'CABA'
      }
    }
  })
  console.log('Usuario A registrado:', userA.user?.id)

  const emailB = `testB_${Date.now()}@test.com`
  const { data: userB } = await supabase.auth.signUp({
    email: emailB,
    password: 'password123',
    options: {
      data: {
        username: `userB_${Date.now()}`,
        age: 28,
        gender: 'M',
        region: 'GBA Norte'
      }
    }
  })
  console.log('Usuario B registrado:', userB.user?.id)

  await supabase.auth.signInWithPassword({ email: emailA, password: 'password123' })

  console.log('Probando si el bug del DM sigue ocurriendo desde las actions...')
  
  // Note: we can't easily run Next.js Server Actions directly in a raw node script.
  // We'll emulate what the fixed `getOrCreateDMRoom` does to ensure the SQL schema / trigger is behaving.
  const { data: newDm } = await supabase
    .from('dm_channels')
    .insert({
      user1_id: userA.user?.id,
      user2_id: userB.user?.id
    })
    .select('id')
    .single()
    
  console.log('Canal DM Creado (id channel):', newDm?.id)

  const { data: room, error: errRoom } = await supabase
    .from('rooms')
    .select('id')
    .eq('reference_id', newDm?.id)
    .single()
    
  console.log('ID real de la Sala (room):', room?.id)

  const { error: msgErr2 } = await supabase.from('messages').insert({
    room_id: room?.id,
    sender_id: userA.user?.id,
    text: 'Hola desde User A usando el room id correcto!',
    type: 'text'
  })
  
  if (msgErr2) console.error('Error insertando mensaje:', msgErr2.message)
  else console.log('Éxito! El mensaje se insertó correctamente usando el room.id')

  console.log('--- Tests Completados ---')
}

runTests()
