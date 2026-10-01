'use server'

import { createClient } from '@/lib/supabase/server'

const FALLBACK_INTERESTS = [
  { id: '952c21db-e1d4-46c9-953e-ea568bc6b732', name: 'Cine' },
  { id: 'b7138663-39d5-41f7-bcea-18ed18fc52e3', name: 'Bares' },
  { id: '785abfbb-f3fa-4237-aab1-74fd7722263b', name: 'Museos' },
  { id: '4517d177-8e2d-497d-8f3a-a3fb3998c8b6', name: 'Picnic' },
  { id: 'fa1b9ef6-00c0-45ce-a231-fd0ec6e3c312', name: 'Running' },
  { id: '665b2366-5210-445e-badd-553542d3d7ba', name: 'Cafés' },
  { id: 'afef8eaa-0bf8-4214-8164-36ae48ba9014', name: 'Gaming' },
  { id: '90470d9e-cdc5-4efb-b989-01449c70260f', name: 'Lectura' },
  { id: '0df6df4d-b074-48a9-98fc-7da05340b659', name: 'Música' },
  { id: 'bd263c8c-ac60-4801-ab83-863e957d61d8', name: 'Teatro' }
];

const FALLBACK_REGIONS = [
  { id: '4f697c97-758f-40f6-91d6-0532e6eeace8', name: 'CABA', room_id: '834385f5-26a0-4cf6-b655-0aa994bbac77' },
  { id: 'b490978c-d607-48ba-8b21-5c1ce3108c54', name: 'GBA Norte', room_id: '9c8961c8-8dc0-4ff5-8925-ff76eb13bf00' },
  { id: '308b1ab3-ae4d-4974-a378-c0465b578e11', name: 'GBA Sur', room_id: '4c7d0e14-0775-4046-a5b2-973463b895ac' },
  { id: '3d31f36e-1ff9-4cf6-93f5-92d3ace79190', name: 'GBA Oeste', room_id: '2097f2e3-abed-4d8c-8000-a06edbee08a2' },
  { id: 'b4db82e9-98cc-4b8d-ae75-cfcd9c3c2401', name: 'Córdoba', room_id: '321a455d-f80a-41e7-b35f-a32aa465a97d' },
  { id: '610a4050-fc55-48cc-8cd6-830fe0bef435', name: 'Mendoza', room_id: '12522fc1-adb1-447b-9bc9-98d2c588639f' },
  { id: '47909995-8090-4141-9354-00010a911e77', name: 'Rosario', room_id: '85741e65-4a5c-4b60-8655-370c56362690' }
];

export async function getRegions() {
  try {
    const supabase = await createClient()

    const { data: regions, error: regionsError } = await supabase.from('regions').select('*').order('name')

    if (regionsError || !regions || regions.length === 0) {
      console.log('Using fallback regions due to error or empty result (likely RLS for anon user)')
      return { regions: FALLBACK_REGIONS }
    }

    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, reference_id')
      .eq('type', 'region')

    if (roomsError || !rooms || rooms.length === 0) {
      return { regions: FALLBACK_REGIONS }
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
    return { regions: FALLBACK_REGIONS }
  }
}

export async function getInterests() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.from('interests').select('*').order('name')

    if (error || !data || data.length === 0) {
      console.log('Using fallback interests due to error or empty result (likely RLS for anon user)')
      return { interests: FALLBACK_INTERESTS }
    }

    return { interests: data }
  } catch (err) {
    console.error(err)
    return { interests: FALLBACK_INTERESTS }
  }
}

export async function getRegionMemberCount(regionName: string) {
  try {
    const supabase = await createClient()
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('region', regionName)
    
    if (error) throw error
    return { count: count || 0 }
  } catch (err) {
    console.error('Error fetching member count:', err)
    return { count: 0 }
  }
}
