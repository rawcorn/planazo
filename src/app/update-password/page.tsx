'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { notifyPasswordChanged } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

import { useEffect } from 'react'

export default function UpdatePasswordPage() {
  const supabase = createClient()

  useEffect(() => {
    // Automatically handle the hash manually in case SSR router strips it
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      if (access_token && refresh_token) {
        supabase.auth.setSession({ access_token, refresh_token }).then(({ data, error }) => {
          if (error || !data.session) setHasToken(false);
        });
      }
    } else {
      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) setHasToken(false);
      })
    }
  }, [])
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [hasToken, setHasToken] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setError('La contraseña debe tener mínimo 8 caracteres, 1 mayúscula y 1 carácter especial.')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setError('Error al actualizar la contraseña: ' + error.message)
      } else {
        await notifyPasswordChanged();
        setSuccess(true)
        setTimeout(() => {
          router.push('/')
        }, 2500)
      }
    } catch (err: any) {
      setError('Error al actualizar la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#DFD8F7] flex flex-col items-center justify-center py-12 px-4 font-sans">
      <div className="w-full max-w-[340px] bg-[#FAF8F2] rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col border-0">
        <div className="pt-10 pb-6 px-8 text-center bg-[#E4E6F8] flex flex-col items-center">
          <img src="/logo-planazo.png" alt="Logo Planazo" className="w-24 h-24 object-contain drop-shadow-sm -mb-4" />
          <h1 className="text-xl font-extrabold text-[#3F3F46] tracking-normal mt-2">Nueva Contraseña</h1>
        </div>

        <div className="px-7 pb-8 pt-6">
          {!hasToken ? (
            <div className="text-center space-y-4">
              <div className="p-3 bg-red-100 text-red-700 text-[11.5px] leading-tight rounded-xl font-medium">
                El enlace de recuperación es inválido o ya expiró. Por favor solicitá uno nuevo.
              </div>
            </div>
          ) : !success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3 bg-red-100 text-red-600 text-[11.5px] leading-tight rounded-xl text-center font-medium">{error}</div>}
              
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#52525B] uppercase tracking-wide ml-2">Nueva Contraseña</label>
                <div className="relative">
                  <input 
                    required 
                    type={showPassword ? "text" : "password"} 
                    className="w-full bg-[#E4E6F8] border-[1.5px] border-[#8D96D6] rounded-full px-5 pr-12 py-3 text-sm text-[#3F3F46] outline-none focus:ring-2 focus:ring-[#727CB5] transition-all" 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8D96D6] hover:text-[#727CB5] transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-[#8D96D6] text-[10px] mt-1 ml-2 leading-tight">Mínimo 8 caracteres, 1 mayúscula y 1 caracter especial.</p>
              </div>

              <Button disabled={loading} type="submit" className="w-full h-12 mt-2 text-[15px] rounded-full bg-[#7ac7ac] hover:bg-[#7ac7ac] text-white font-bold border-0 transition-all shadow-none">
                {loading ? 'Guardando...' : 'Actualizar Contraseña'}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="p-3 bg-green-100 text-green-700 text-[11.5px] leading-tight rounded-xl font-medium">
                ¡Contraseña actualizada con éxito! Redirigiendo...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
