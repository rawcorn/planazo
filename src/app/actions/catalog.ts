'use server'

import { createClient } from '@/lib/supabase/server'

export async function getRegions() {
  try {
    const supabase = await createClient()

    const { data: regions, error: regionsError } = await supabase.from('regions').select('*').order('name')

    if (regionsError) {
      console.error(regionsError)
      return { error: 'Error al obtener regiones' }
    }

    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, reference_id')
      .eq('type', 'region')

    if (roomsError) {
      console.error(roomsError)
      return { error: 'Error al obtener las salas de regiones' }
    }

    const regionsWithRooms = regions.map(region => {
      const room = rooms.find(r => r.reference_id === region.id)
      return {
        ...region,
        room_id: room?.id || null
      }
    })

    return { regions: regionsWithRooms }
  } catch (err) {
    console.error(err)
    return { error: 'Error interno del servidor' }
  }
}

export async function getInterests() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.from('interests').select('*').order('name')

    if (error) {
      console.error(error)
      return { error: 'Error al obtener intereses' }
    }

    return { interests: data }
  } catch (err) {
    console.error(err)
    return { error: 'Error interno del servidor' }
  }
}
