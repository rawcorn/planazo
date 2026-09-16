import { z } from 'zod'

const signUpSchema = z.object({
  email: z.string().email('Email inválido').optional().or(z.literal('')),
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

const result = signUpSchema.safeParse({
  email: '',
  password: 'Password123!',
  username: 'testuser',
  age: 20,
  gender: 'F',
  region: 'CABA',
  instagram: '',
  facebook: '',
  avatarUrl: ''
})

console.log(result.success ? "Success" : JSON.stringify(result.error.issues, null, 2));
