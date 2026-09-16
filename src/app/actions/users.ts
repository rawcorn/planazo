'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { profileUpdateSchema } from '@/lib/validations'

export async function getCurrentUser() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    const { data: profile, error } = await supabase
      .from('users')
      .select('*, user_interests(interest_id)')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      console.error(error)
      return null
    }

    if (!profile) {
      // Auto-recover missing profile (e.g. if trigger failed or DB was partially reset)
      const { data: newProfile, error: insertErr } = await supabase.from('users').insert({
        id: user.id,
        username: user.user_metadata?.username || user.email?.split('@')[0] || `user_${Date.now()}`,
        email: user.email || '',
        age: user.user_metadata?.age || 18,
        gender: user.user_metadata?.gender || 'X',
        region: user.user_metadata?.region || 'CABA',
        instagram: user.user_metadata?.instagram || null,
        facebook: user.user_metadata?.facebook || null,
        avatar_url: user.user_metadata?.avatar_url || null
      }).select().single();

      if (insertErr || !newProfile) {
        console.error("Failed to auto-create profile", insertErr);
        return null;
      }
      
      return JSON.parse(JSON.stringify({ ...newProfile, interests: [] }));
    }

    // Fetch actual interests if needed, but the UI might just need IDs or we can join them
    const { data: interestsData, error: interestsError } = await supabase
      .from('interests')
      .select('*')
      .in(
        'id',
        (profile as any).user_interests.map((ui: any) => ui.interest_id)
      )

    if (interestsError) {
      console.error(interestsError)
    }

    const result = {
      ...profile,
      interests: interestsData || [],
    };
    return JSON.parse(JSON.stringify(result));
  } catch (err) {
    console.error(err)
    return null
  }
}

export async function updateProfile(data: any) {
  try {
    const parsed = profileUpdateSchema.safeParse(data)
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

    const { error } = await supabase.from('users').update(parsed.data).eq('id', user.id)

    if (error) {
      console.error(error)
      return { error: 'Error al actualizar el perfil' }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Error interno del servidor' }
  }
}

export async function updateUserInterests(interestIds: string[]) {
  try {
    if (!Array.isArray(interestIds)) {
      return { error: 'Datos inválidos' }
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Delete all existing and insert new
    const { error: delError } = await supabase.from('user_interests').delete().eq('user_id', user.id)
    if (delError) {
      console.error(delError)
      return { error: 'Error al actualizar intereses' }
    }

    if (interestIds.length > 0) {
      const { error } = await supabase.from('user_interests').insert(
        interestIds.map((id) => ({
          user_id: user.id,
          interest_id: id,
        }))
      )

      if (error) {
        console.error(error)
        return { error: 'Error al guardar los nuevos intereses' }
      }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Error interno del servidor' }
  }
}
