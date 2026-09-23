'use server'

import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function uploadImage(formData: FormData) {
  const file = formData.get('file') as File;
  const bucket = (formData.get('bucket') as string) || 'event_images';
  if (!file) return null;
  
  // Validation: Only allow specific buckets
  if (bucket !== 'event_images' && bucket !== 'avatars') {
    console.error('Invalid bucket requested:', bucket);
    return null;
  }

  // Validation: limit size to roughly 7.5MB raw
  if (file.size > 7.5 * 1024 * 1024) {
    console.error('Image size exceeds limit');
    return null;
  }

  try {
    const supabase = await createClient()

    const contentType = file.type;
    
    // Check MIME type is an image
    if (!contentType.startsWith('image/')) {
      console.error('Invalid content type:', contentType);
      return null;
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generar un nombre único para el archivo
    const extension = contentType.split('/')[1] || 'png';
    const fileName = `${crypto.randomUUID()}.${extension}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType,
        upsert: false
      });

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    // Obtener la URL pública
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error processing image upload:', error);
    return null;
  }
}
