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

    const { password, username, age, gender, region } = parsed.data
    let { email } = parsed.data

    if (!email) {
      email = `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@planazo.local`
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
          region
        }
      }
    })

    if (authError) {
      console.error(authError)
      return { error: 'Error al registrar el usuario. Es posible que el email ya esté en uso.' }
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
      return { error: 'Credenciales inválidas' }
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
