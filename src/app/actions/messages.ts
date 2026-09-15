'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { messageSchema } from '@/lib/validations'

export async function sendMessage(roomId: string, text: string, parentId?: string) {
  try {
    const parsed = messageSchema.safeParse({ roomId, text })
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

    // ACÁ ESTABA EL PROBLEMA: Faltaba guardar el parent_id en la base de datos
    const { error, data } = await supabase.from('messages').insert({
      room_id: parsed.data.roomId,
      sender_id: user.id,
      text: parsed.data.text,
      type: 'text',
      // @ts-ignore
      parent_id: parentId || null // <-- AHORA SÍ SE GUARDA LA RESPUESTA
    }).select()

    if (error) {
      console.error("SERVER ACTION INSERT ERROR:", error)
      return { error: 'Error al enviar el mensaje' }
    }
    console.log("SERVER ACTION INSERT SUCCESS:", data)

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    console.error("SERVER ACTION CATCH ERROR:", err)
    return { error: 'Error interno del servidor' }
  }
}

export async function getRoomMessages(roomId: string, page: number = 0, limit: number = 50) {
  try {
    const supabase = await createClient()

    const from = page * limit
    const to = from + limit - 1

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users(username, avatar_url, region),
        event:events(title, description)
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error(error)
      return { error: 'Error al obtener mensajes' }
    }

    // Return messages in chronological order for the UI, even though we fetched the latest first
    return { messages: data.reverse() }
  } catch (err) {
    console.error(err)
    return { error: 'Error interno del servidor' }
  }
}

export async function getOrCreateDMRoom(targetUserId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // Check if channel already exists
    const { data: existing, error: errExist } = await supabase
      .from('dm_channels')
      .select('id')
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${user.id})`)
      .maybeSingle()

    let dmChannelId = existing?.id;

    if (!dmChannelId) {
      // Create new dm_channel
      const { data: newDm, error: errInsert } = await supabase
        .from('dm_channels')
        .insert({
          user1_id: user.id,
          user2_id: targetUserId
        })
        .select('id')
        .single()

      if (errInsert || !newDm) {
        console.error(errInsert)
        return { error: 'Error al crear el canal de DM' }
      }
      dmChannelId = newDm.id
    }

    // Get the actual room_id for the dm channel
    const { data: room, error: errRoom } = await supabase
      .from('rooms')
      .select('id')
      .eq('reference_id', dmChannelId)
      .single()

    if (errRoom || !room) {
      console.error(errRoom)
      return { error: 'Error al obtener la sala del DM' }
    }

    return { roomId: room.id }
  } catch (err) {
    console.error(err)
    return { error: 'Error interno del servidor' }
  }
}

export async function deleteMessageForEveryone(messageId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // Verificar que sea el autor
    const { data: msg } = await supabase.from('messages').select('sender_id').eq('id', messageId).single()
    if (!msg || msg.sender_id !== user.id) {
      return { error: 'No tienes permiso para eliminar este mensaje' }
    }

    // @ts-ignore - is_deleted might not be in the generated types yet
    const { error } = await supabase
      .from('messages')
      // @ts-ignore
      .update({ is_deleted: true, text: '' })
      .eq('id', messageId)

    if (error) {
      console.error(error)
      return { error: 'Error al eliminar mensaje' }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Error interno' }
  }
}

export async function deleteMessageForMe(messageId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // Llamamos a la función segura que acabamos de crear en Supabase
    // @ts-ignore
    const { error } = await supabase.rpc('hide_message_for_user', {
      message_id: messageId,
      user_to_hide: user.id
    })

    if (error) {
      console.error("Error al ocultar mensaje:", error)
      return { error: 'Error al eliminar mensaje para ti' }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Error interno' }
  }
}

export async function getDMChannels() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: channels, error: channelsErr } = await supabase
      .from('dm_channels')
      .select('id, user1_id, user2_id')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

    if (channelsErr || !channels) {
      console.error(channelsErr)
      return { error: 'Error al obtener DM channels' }
    }

    if (channels.length === 0) return { channels: [] }

    const channelIds = channels.map(c => c.id)
    const { data: rooms, error: roomsErr } = await supabase
      .from('rooms')
      .select('id, reference_id')
      .in('reference_id', channelIds)

    if (roomsErr) {
      console.error(roomsErr)
      return { error: 'Error al obtener rooms de DM channels' }
    }

    const mappedChannels = channels.map(ch => {
       const room = rooms?.find(r => r.reference_id === ch.id)
       const otherUserId = ch.user1_id === user.id ? ch.user2_id : ch.user1_id
       return { ...ch, other_user_id: otherUserId, rooms: room ? { id: room.id } : null }
    })

    return { channels: mappedChannels }
  } catch (err) {
    console.error(err)
    return { error: 'Error interno' }
  }
}