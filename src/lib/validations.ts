import { z } from 'zod'

export const signUpSchema = z.object({
  email: z.string().trim().email('Email inválido').optional().or(z.literal('')),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
    .regex(/[^a-zA-Z0-9]/, 'La contraseña debe contener al menos un carácter especial'),
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres').max(30),
  age: z.number().int().min(18, 'Debes ser mayor de 18 años'),
  gender: z.enum(['F', 'M', 'X'], { error: 'Género inválido' }),
  region: z.string().min(1, 'La región es obligatoria'),
  instagram: z.string().optional().or(z.literal('')),
  facebook: z.string().optional().or(z.literal('')),
  avatarUrl: z.string().optional().or(z.literal(''))
})

export const signInSchema = z.object({
  email: z.string().min(1, 'Usuario o Email es obligatorio'),
  password: z.string().min(1, 'La contraseña es obligatoria')
})

export const eventSchema = z.object({
  title: z.string().min(3, 'El título es muy corto').max(100, 'El título es muy largo'),
  description: z.string().max(1000).optional().or(z.literal('')),
  region_id: z.string().uuid('Región inválida'),
  category_id: z.string().uuid('Categoría inválida'),
  event_datetime: z.string().refine((val) => {
    const date = new Date(val)
    return !isNaN(date.getTime()) && date > new Date()
  }, { message: 'La fecha del evento debe ser en el futuro' }),
  address: z.string().optional(),
  max_attendees: z.number().int().min(2, 'Debe haber al menos 2 asistentes').optional(),
  min_age: z.number().int().min(18).optional(),
  max_age: z.number().int().max(100).optional(),
  image_url: z.string().url().optional()
})

export const messageSchema = z.object({
  roomId: z.string().uuid('Sala inválida'),
  text: z.string().min(1, 'El mensaje no puede estar vacío').max(1000, 'Mensaje muy largo')
})

export const profileUpdateSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  age: z.number().int().min(18).optional(),
  gender: z.enum(['F', 'M', 'X']).optional(),
  region: z.string().optional(),
  avatar_url: z.string().url().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional()
})
