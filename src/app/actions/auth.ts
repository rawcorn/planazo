'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

async function sendWelcomeEmail(email: string, username: string) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) return;

  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 5px 30px 30px 30px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://planazo.online/logo-planazo.png" alt="Planazo Logo" style="width: 160px; height: auto; margin-bottom: 15px;" />
          <h1 style="color: #75d1a4; font-size: 26px; margin: 0; white-space: nowrap; letter-spacing: -0.5px;">¡Ya sos parte de Planazo!</h1>
      </div>
      <p style="color: #334155; font-size: 16px; line-height: 1.5;">hola <strong>${username}</strong>,</p>
      <p style="color: #334155; font-size: 16px; line-height: 1.5;">Qué lindo tenerte por acá. Ya podés empezar a conocer gente por tu zona y armar planes para salir.</p>
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
    
    const supabase = await createClient()
    let email = identifier
    if (!identifier.includes('@')) {
      const username = identifier.toLowerCase().trim();
      const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const adminSupabase = SUPABASE_SERVICE_ROLE_KEY ? createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } }) : supabase;
      
      const { data: userProfile } = await adminSupabase
        .from('users')
        .select('email')
        .eq('username', username)
        .single();

      if (userProfile && userProfile.email) {
        email = userProfile.email;
      } else {
        email = `${username.replace(/[^a-z0-9]/g, '')}@planazo.local`;
      }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error(error)
      return { error: `SIGNIN_ERROR: ${error.message}`, step: 'signin' }
    }

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
    
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Error interno del servidor' }
  }
}

export async function resetPassword(email: string) {
  try {
    const supabase = await createClient()

    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
      return { error: 'Error interno del servidor.' };
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('id, username')
      .eq('email', email)
      .maybeSingle()

    if (!userProfile) {
      return { error: 'Correo no registrado.' }
    }

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: 'https://planazo.online/update-password'
      }
    });

    if (linkError || !linkData || !linkData.properties || !linkData.properties.action_link) {
      console.error(linkError);
      return { error: 'No se pudo generar el enlace de recuperación.' }
    }

    const actionLink = linkData.properties.action_link;
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    
    if (RESEND_API_KEY) {
      const htmlContent = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 5px 30px 30px 30px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://planazo.online/logo-planazo.png" alt="Planazo Logo" style="width: 160px; height: auto; margin-bottom: 15px;" />
          <h1 style="color: #75d1a4; font-size: 26px; margin: 0; white-space: nowrap; letter-spacing: -0.5px;">Recuperá tu contraseña</h1>
          </div>
          <p style="color: #334155; font-size: 16px; line-height: 1.5;">Hola <strong>${userProfile.username || 'Usuario'}</strong>,</p>
          <p style="color: #334155; font-size: 16px; line-height: 1.5;">Recibimos una solicitud para restablecer la contraseña de tu cuenta en Planazo. Podés crear una nueva haciendo clic en el siguiente botón:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${actionLink}" style="background-color: #75d1a4; color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block;">Restablecer contraseña</a>
          </div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
          <p style="color: #64748b; font-size: 14px; text-align: center; margin: 0;">Si no solicitaste este cambio, podés ignorar este correo sin problema.</p>
        </div>
      `;

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'Planazo <noreply@planazo.online>',
          to: email,
          subject: 'Recuperá tu contraseña de Planazo',
          html: htmlContent
        })
      });
      
      if (!res.ok) {
        console.error('Resend error:', await res.text());
        return { error: 'No se pudo enviar el correo de recuperación.' }
      }
    } else {
      console.warn('RESEND_API_KEY missing, skipping email send');
    }

    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Error interno del servidor' }
  }
}


async function sendPasswordChangedEmail(email: string, username: string) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) return;

  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 5px 30px 30px 30px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://planazo.online/logo-planazo.png" alt="Planazo Logo" style="width: 160px; height: auto; margin-bottom: 15px;" />
        <h1 style="color: #75d1a4; font-size: 26px; margin: 0; white-space: nowrap; letter-spacing: -0.5px;">Contraseña actualizada</h1>
      </div>
      <p style="color: #334155; font-size: 16px; line-height: 1.5;">Hola <strong>${username}</strong>,</p>
      <p style="color: #334155; font-size: 16px; line-height: 1.5;">Te avisamos que la contraseña de tu cuenta de Planazo fue modificada exitosamente.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="color: #ef4444; font-size: 16px; line-height: 1.5; text-align: center;">¿No fuiste vos?</p>
      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0; line-height: 1.3;">Si no fuiste vos quien hizo este cambio, respondé a este mail para que bloqueemos temporalmente tu cuenta y revirtamos el cambio.</p>
    </div>
  `;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer ${RESEND_API_KEY}\`
      },
      body: JSON.stringify({
        from: 'Planazo <noreply@planazo.online>',
        to: email,
        reply_to: 'soporte@planazo.online',
        subject: 'Aviso de seguridad: Tu contraseña fue cambiada',
        html: htmlContent
      })
    });
  } catch (error) {
    console.error('Failed to send password changed email:', error);
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
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: 'Error interno del servidor' }
  }
}
