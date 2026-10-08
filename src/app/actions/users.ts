'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { profileUpdateSchema } from '@/lib/validations'


async function sendSecurityAlertEmail(oldEmail: string, newEmail: string, username: string) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) return;

  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 5px 30px 30px 30px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://planazo.online/logo-planazo.png" alt="Planazo Logo" style="width: 160px; height: auto; margin-bottom: 15px;" />
          <h1 style="color: #75d1a4; font-size: 26px; margin: 0; white-space: nowrap; letter-spacing: -0.5px;">Aviso de seguridad</h1>
      </div>
      <p style="color: #334155; font-size: 16px; line-height: 1.5;">Hola <strong>${username}</strong>,</p>
      <p style="color: #334155; font-size: 16px; line-height: 1.5;">El correo asociado a tu cuenta de Planazo acaba de ser cambiado.</p>
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #475569; font-size: 14px;">Correo anterior: <a href="mailto:${oldEmail}" style="color: #475569; text-decoration: none; font-weight: normal;">${oldEmail}</a></p>
          <p style="margin: 8px 0 0 0; color: #475569; font-size: 14px;">Nuevo correo: <a href="mailto:${newEmail}" style="color: #475569; text-decoration: none; font-weight: normal;">${newEmail}</a></p>
      </div>
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
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Planazo <noreply@planazo.online>',
        to: oldEmail,
        reply_to: 'soporte@planazo.online',
        subject: 'Aviso de seguridad: Tu email de Planazo fue cambiado',
        html: htmlContent
      })
    });
  } catch (error) {
    console.error('Failed to send security email:', error);
  }
}

async function sendEmailAssignedNotice(email: string, username: string) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) return;

  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 5px 30px 30px 30px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://planazo.online/logo-planazo.png" alt="Planazo Logo" style="width: 160px; height: auto; margin-bottom: 15px;" />
          <h1 style="color: #75d1a4; font-size: 26px; margin: 0; white-space: nowrap; letter-spacing: -0.5px;">¡Email asignado!</h1>
      </div>
      <p style="color: #334155; font-size: 16px; line-height: 1.5;">Hola <strong>${username}</strong>,</p>
      <p style="color: #334155; font-size: 16px; line-height: 1.5;">Te escribimos para avisarte que este correo (<a href="mailto:${email}" style="color: #334155; text-decoration: none; font-weight: normal;">${email}</a>) fue asignado exitosamente a tu cuenta de Planazo.</p>
      <p style="color: #334155; font-size: 16px; line-height: 1.5;">A partir de ahora, vas a poder usar este email para iniciar sesión o para recuperar tu contraseña si te la olvidás.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://planazo.online" style="background-color: #75d1a4; color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block;">Ir a Planazo</a>
      </div>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="color: #64748b; font-size: 14px; text-align: center; margin: 0;">Si no solicitaste este cambio, por favor contactanos respondiendo a este correo.</p>
    </div>
  `;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Planazo <noreply@planazo.online>',
        to: email,
        reply_to: 'soporte@planazo.online',
        subject: 'Email asignado a tu cuenta de Planazo',
        html: htmlContent
      })
    });
  } catch (error) {
    console.error('Failed to send email notice:', error);
  }
}


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
          tiktok: user.user_metadata?.tiktok || null,
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
      if (user.user_metadata?.tiktok && profile.tiktok !== user.user_metadata.tiktok) {
        updates.tiktok = user.user_metadata.tiktok;
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
      const metaUpdates: any = {};
      
      if ('email' in updateData) {
          emailToUpdate = updateData.email;
          delete updateData.email;
      }
      if ('instagram' in updateData) {
          metaUpdates.instagram = updateData.instagram;
          delete updateData.instagram;
      }
      if ('tiktok' in updateData) {
          metaUpdates.tiktok = updateData.tiktok;
          delete updateData.tiktok;
      }
      if ('facebook' in updateData) {
          metaUpdates.facebook = updateData.facebook;
          delete updateData.facebook;
      }

      // Update Auth user_metadata via standard client
      if (Object.keys(metaUpdates).length > 0) {
        const { error: metaError } = await supabase.auth.updateUser({
          data: metaUpdates
        });
        if (metaError) {
          console.error(metaError);
          return { error: 'Error al actualizar redes: ' + metaError.message };
        }
      }

      // Update custom profile fields in users table
    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase.from('users').update(updateData).eq('id', user.id)
      if (error) {
        console.error(error)
        return { error: 'Error al actualizar el perfil: ' + error.message }
      }
    }
    
        // Update email in Auth and users table using Admin client to bypass confirmation emails
    if (emailToUpdate !== undefined && emailToUpdate !== user.email) {
       const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
       if (!SUPABASE_SERVICE_ROLE_KEY) {
         return { error: 'No se pudo actualizar el email (falta clave de admin)' };
       }

       const { createClient: createAdminClient } = require('@supabase/supabase-js');
       const supabaseAdmin = createAdminClient(
         process.env.NEXT_PUBLIC_SUPABASE_URL,
         SUPABASE_SERVICE_ROLE_KEY,
         { auth: { autoRefreshToken: false, persistSession: false } }
       );

       const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(user.id, { 
         email: emailToUpdate, 
         email_confirm: true 
       });

       if (authError) {
         console.error('Error updating auth email:', authError);
         if (authError.message.includes('Error updating user') || authError.message.includes('already')) {
              return { error: 'Email ya registrado.' };
           }
           return { error: 'Error de email: ' + authError.message };
       }
       
       const { error: userTableError } = await supabaseAdmin.from('users').update({ email: emailToUpdate }).eq('id', user.id);
         if (userTableError) {
             console.error('Error updating user table email:', userTableError);
         }
         
         await sendEmailAssignedNotice(emailToUpdate, user.user_metadata?.username || 'Usuario');
         
         // Send security alert to old email if it was a real email
         if (user.email && !user.email.endsWith('@planazo.local')) {
            await sendSecurityAlertEmail(user.email, emailToUpdate, user.user_metadata?.username || 'Usuario');
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
