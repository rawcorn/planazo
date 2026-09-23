'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { eventSchema } from '@/lib/validations'

export async function createEvent(eventData: any) {
  try {
    const parsed = eventSchema.safeParse(eventData)
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message }
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('events')
      .insert({
        ...parsed.data,
        description: parsed.data.description || '',
        creator_id: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error(error)
      return { error: 'Error al crear el evento' }
    }

    revalidatePath('/', 'layout')
    return { success: true, event: data }
  } catch (err) {
    console.error(err)
    return { error: 'Error interno del servidor' }
  }
}

export async function updateEvent(eventId: string, eventData: any) {
  try {
    const parsed = eventSchema.safeParse(eventData)
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message }
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('events')
      .update({
        ...parsed.data,
        description: parsed.data.description || '',
      })
      .eq('id', eventId)
      .eq('creator_id', user.id)
      .select()
      .single()

    if (error) {
      console.error(error)
      return { error: 'Error al actualizar el evento' }
    }

    revalidatePath('/', 'layout')
    return { success: true, event: data }
  } catch (err) {
    console.error(err)
    return { error: 'Error interno del servidor' }
  }
}

export async function deleteEvent(eventId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
      .eq('creator_id', user.id)

    if (error) {
      console.error(error)
      return { error: 'Error al eliminar el evento' }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Error interno del servidor' }
  }
}

export async function joinEvent(eventId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { error } = await supabase.from('event_attendees').insert({
      event_id: eventId,
      user_id: user.id,
    })

    if (error) {
      console.error(error)
      return { error: 'Error al unirse al evento' }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Error interno del servidor' }
  }
}

export async function leaveEvent(eventId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('event_attendees')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', user.id)

    if (error) {
      console.error(error)
      return { error: 'Error al abandonar el evento' }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Error interno del servidor' }
  }
}

export async function getEventsByRegion(regionId: string, page: number = 0, limit: number = 20) {
  try {
    const supabase = await createClient()

    const from = page * limit
    const to = from + limit - 1

    // Select events and their attendees count
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        creator:users!events_creator_id_fkey(username, avatar_url),
        event_attendees(user_id, users!event_attendees_user_id_fkey(username, avatar_url, age, gender))
      `)
      .eq('region_id', regionId)
      .order('event_datetime', { ascending: true })
      .range(from, to)

    if (error) {
      console.error(error)
      return { error: 'Error al obtener eventos' }
    }

    return { events: data }
  } catch (err) {
    console.error(err)
    return { error: 'Error interno del servidor' }
  }
}

export async function getEventDetails(eventId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        creator:users!events_creator_id_fkey(username, avatar_url),
        event_attendees(user_id, users!event_attendees_user_id_fkey(username, avatar_url, age, gender))
      `)
      .eq('id', eventId)
      .single()

    if (error) {
      console.error(error)
      return { error: 'Error al obtener los detalles del evento' }
    }

    return { event: data }
  } catch (err) {
    console.error(err)
    return { error: 'Error interno del servidor' }
  }
}
