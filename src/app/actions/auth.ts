'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { signUpSchema, signInSchema } from '@/lib/validations'

export async function signUp(data: any) {
  try {
    const parsed = signUpSchema.safeParse(data)
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message }
    }

    let { email } = parsed.data
    const username = parsed.data.username.toLowerCase();
    const { password, age, gender, region, instagram, tiktok, facebook, avatarUrl } = parsed.data

    if (!email) {
      email = `${username.replace(/[^a-z0-9]/g, '')}@planazo.local`
    }

    const supabase = await createClient()

    // 1. Sign up the user in Supabase Auth (Trigger will handle public.users)
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          age,
          gender,
          region,
          instagram,
          facebook,
          avatar_url: avatarUrl
        }
      }
    })

    if (authError) {
      console.error(authError)
      return { error: `DB_ERROR: ${authError.message}`, step: 'signup' }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Error interno del servidor' }
  }
}

export async function registerFullFlow(data: any, interests: string[]) {
  try {
    const parsed = signUpSchema.safeParse(data)
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message }
    }

    let { email } = parsed.data
    const username = parsed.data.username.toLowerCase();
    const { password, age, gender, region, instagram, tiktok, facebook, avatarUrl } = parsed.data

    if (!email) {
      email = `${username.replace(/[^a-z0-9]/g, '')}@planazo.local`
    }

    const supabase = await createClient()

    // 1. Sign up
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          age,
          gender,
          region,
          instagram,
          facebook,
          avatar_url: avatarUrl
        }
      }
    })

    if (authError) {
      console.error("Signup error:", authError)
      return { error: `DB_ERROR: ${authError.message}`, step: 'signup' }
    }

    // 2. Sign in immediately
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      console.error("Signin error:", signInError)
      return { error: `SIGNIN_ERROR: ${signInError.message}`, step: 'signin' }
    }

    // 3. Update interests if provided
    if (interests && interests.length > 0) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error: interestsErr } = await supabase.from('user_interests').insert(
          interests.map((id) => ({
            user_id: user.id,
            interest_id: id,
          }))
        )
        if (interestsErr) console.error("Interests error:", interestsErr)
      }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Error interno del servidor' }
  }
}


export async function signIn(data: any) {
  try {
    const parsed = signInSchema.safeParse(data)
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message }
    }

    const { email: identifier, password } = parsed.data
    
    let email = identifier
    if (!identifier.includes('@')) {
      email = `${identifier.toLowerCase().replace(/[^a-z0-9]/g, '')}@planazo.local`
    }

    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error(error)
      return { error: `SIGNIN_ERROR: ${error.message}`, step: 'signin' }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Error interno del servidor' }
  }
}

export async function signOut() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error(error)
      return { error: 'Error al cerrar sesión' }
    }
    
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Error interno del servidor' }
  }
}

export async function resetPassword(email: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:3000', // adjust for prod later
    })
    
    if (error) {
      console.error(error)
      return { error: 'No se pudo enviar el correo de recuperación.' }
    }
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Error interno del servidor' }
  }
}

export async function updatePassword(password: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.updateUser({ password })
    
    if (error) {
      console.error(error)
      return { error: 'Error al actualizar la contraseña.' }
    }
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Error interno del servidor' }
  }
}

export async function deleteAccount() {
  try {
    const supabase = await createClient()
    // Requires an RPC to delete the user from auth.users securely
    // @ts-ignore - The RPC is not yet in the generated database.types.ts
    const { error } = await supabase.rpc('delete_account')
    
    if (error) {
      console.error(error)
      return { error: 'Error al eliminar la cuenta. ' + error.message }
    }
    
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Error interno del servidor' }
  }
}
