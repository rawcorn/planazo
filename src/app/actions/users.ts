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

    // Sync fields if they exist in auth but not in profile
    let needsUpdate = false;
    const updates: any = {};
    if (user.user_metadata?.instagram && profile.instagram !== user.user_metadata.instagram) {
      updates.instagram = user.user_metadata.instagram;
      needsUpdate = true;
    }
    if (user.user_metadata?.avatar_url && profile.avatar_url !== user.user_metadata.avatar_url) {
      updates.avatar_url = user.user_metadata.avatar_url;
      needsUpdate = true;
    }
    if (user.user_metadata?.facebook && profile.facebook !== user.user_metadata.facebook) {
      updates.facebook = user.user_metadata.facebook;
      needsUpdate = true;
    }

    if (needsUpdate) {
       await supabase.from('users').update(updates).eq('id', user.id);
       Object.assign(profile, updates);
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
    
    const updateData = { ...parsed.data };
    let emailToUpdate = undefined;
    
    if ('email' in updateData) {
        emailToUpdate = updateData.email;
        delete updateData.email;
    }

    // Update custom profile fields in users table
    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase.from('users').update(updateData).eq('id', user.id)
      if (error) {
        console.error(error)
        return { error: 'Error al actualizar el perfil' }
      }
    }
    
    // Update email in Auth and users table if provided
    if (emailToUpdate !== undefined && emailToUpdate !== user.email) {
       // Update in Auth
       const { error: authError } = await supabase.auth.updateUser({ email: emailToUpdate })
       if (authError) {
         console.error('Error updating auth email:', authError)
         return { error: 'Error de seguridad al cambiar email (reintentá en 60 seg)' }
       }
       
       // Update in users table
       const { error: userTableError } = await supabase.from('users').update({ email: emailToUpdate }).eq('id', user.id);
       if (userTableError) {
         console.error('Error updating user table email:', userTableError);
         return { error: 'El email ya está en uso o es inválido' }
       }
    }

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
        return { error: `Error al guardar los nuevos intereses: ${error.message}` }
      }
    }


    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Error interno del servidor' }
  }
}
