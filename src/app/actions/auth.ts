'use server'

import { createClient } from '@/lib/supabase/server'

async function sendWelcomeEmail(email: string, username: string) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) return;

  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #75d1a4; font-size: 26px; margin: 0; white-space: nowrap; letter-spacing: -0.5px;">¡Ya sos parte de Planazo!</h1>
      </div>
      <p style="color: #334155; font-size: 16px; line-height: 1.5;">hola <strong>${username}</strong>,</p>
      <p style="color: #334155; font-size: 16px; line-height: 1.5;">Que lindo tenerte por aca. Ya podes empezar a conocer gente por tu zona y armar planes para salir.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://planazo.online" style="background-color: #75d1a4; color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block;">Ir a la app</a>
      </div>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="color: #64748b; font-size: 14px; text-align: center; margin: 0;">¡Nos vemos adentro!</p>
    </div>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Planazo <noreply@planazo.online>',
        to: email,
        subject: '¡Ya sos parte de Planazo!',
        html: htmlContent
      })
    });
    if (!res.ok) {
      console.error('Resend error:', await res.text());
    }
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
}

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
          tiktok,
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
          tiktok,
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

    // 4. Send purely informative welcome email
    if (email && !email.endsWith('@planazo.local')) {
      sendWelcomeEmail(email, username);
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
