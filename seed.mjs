import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xvzggauuglsqvawozrka.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2emdnYXV1Z2xzcXZhd296cmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3OTkzMTcsImV4cCI6MjA5NjM3NTMxN30.kzcQm6w9Ue9OZ2tzT8MIiOZfK3bMw8SpP79hYmSRki8'
const supabase = createClient(supabaseUrl, supabaseKey)

async function seed() {
  console.log('Iniciando seed de base de datos...')

  const zonas = [
    'Palermo', 'Recoleta', 'Belgrano', 'Caballito', 'San Telmo',
    'Puerto Madero', 'Villa Crespo', 'Núñez', 'GBA Norte', 'GBA Sur', 'GBA Oeste'
  ]

  const intereses = [
    'Salir a bailar', 'Bares y previa', 'Juntadas tranca',
    'Deporte y aire libre', 'Cine y teatro', 'Recitales y música', 'Gastronomía'
  ]

  // Insertar Zonas
  for (const zona of zonas) {
    const { data: region, error: regErr } = await supabase.from('regions').insert({ name: zona }).select().single()
    if (regErr) {
      if (regErr.code !== '23505') console.error('Error insertando zona:', zona, regErr)
    } else if (region) {
      // Create room for region
      const { error: roomErr } = await supabase.from('rooms').insert({ type: 'region', reference_id: region.id })
      if (roomErr) console.error('Error creando sala para zona:', zona, roomErr)
      else console.log('Zona creada:', zona)
    }
  }

  // Insertar Intereses (Categories)
  for (const interes of intereses) {
    const { error: catErr } = await supabase.from('categories').insert({ name: interes })
    if (catErr) {
      if (catErr.code !== '23505') console.error('Error insertando interes:', interes, catErr)
    } else {
      console.log('Interés creado:', interes)
    }
  }

  console.log('Seed finalizado.')
}
seed()
