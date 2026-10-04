import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/uiStore';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

import { signIn, resetPassword } from '@/app/actions/auth';
import { getCurrentUser } from '@/app/actions/users';

export const LoginView = ({ onSwitchToRegister }: { onSwitchToRegister: () => void }) => {
  const [mode, setMode] = useState<'login' | 'forgot_password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const login = useUIStore(state => state.login);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await signIn({ email, password });
      if (res.error) {
        if (res.error.includes('SIGNIN_ERROR') || res.error.includes('Credenciales') || res.error.includes('Invalid path')) {
          setError('Usuario o contraseña incorrectos.');
        } else {
          setError('No se pudo iniciar sesión. Por favor, verificá tus datos.');
        }
        return;
      }
      
      const userRes = await getCurrentUser();
      if (userRes) {
        // Map to store User type
        login({
          id: userRes.id,
          username: userRes.username,
          email: userRes.email,
          age: userRes.age,
          gender: userRes.gender,
          region: userRes.region,
          interests: userRes.interests?.map((i: any) => i.name) || [],
          avatarUrl: userRes.avatar_url || '',
          instagram: userRes.instagram || '',
          facebook: userRes.facebook || ''
        });
        
        const state = useUIStore.getState();
        state.resetRightColumn();
        const userRegionObj = state.regions.find(r => r.name === userRes.region);
        if (userRegionObj) {
          state.setActiveRoom(userRegionObj.room_id);
        } else if (state.regions.length > 0) {
          state.setActiveRoom(state.regions[0].room_id);
        }
      }
    } catch (err: any) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    
    if (!email || !email.includes('@')) {
      setError('Por favor ingresá un correo electrónico válido.');
      setLoading(false);
      return;
    }

    try {
      const res = await resetPassword(email);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccessMsg('¡Correo enviado! Revisá tu bandeja de entrada para restablecer tu contraseña.');
      }
    } catch (err: any) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#DFD8F7] flex flex-col items-center justify-start md:justify-center py-12 md:py-10 px-4 font-sans">
      <div className="w-full max-w-[340px] rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col border-0 relative">
        
        {mode === 'forgot_password' && (
          <button 
            onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }} 
            className="absolute top-4 left-4 z-10 p-2 text-[#8D96D6] hover:bg-[#E4E6F8] rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
        )}

        <div className="pt-10 pb-6 px-8 text-center bg-[#E4E6F8] flex flex-col items-center">
          <img src="/logo-planazo.png" alt="Logo Planazo" className="w-32 h-32 object-contain drop-shadow-sm -mb-4" />
          <h1 className="text-3xl font-extrabold text-[#3F3F46] tracking-normal mt-1">Planazo</h1>
          <p className="text-[#333333] text-sm mt-1">
            {mode === 'login' ? 'Encontrá gente para hacer planes. Rápido, fácil y en tu zona.' : 'Recuperá el acceso a tu cuenta y volvé a los planazos.'}
          </p>
        </div>

        <div className="bg-[#FAF8F2] px-7 pb-8 pt-6">
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              {error && <div className="p-3 bg-red-100 text-red-600 text-sm rounded-xl text-center font-bold">{error}</div>}
              
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#52525B] uppercase tracking-wide ml-2">Usuario o Email</label>
                <input 
                  required 
                  type="text" 
                  className="w-full bg-[#E4E6F8] border-[1.5px] border-[#8D96D6] rounded-full px-5 py-3 text-sm text-[#3F3F46] outline-none focus:ring-2 focus:ring-[#727CB5] transition-all" 
                  placeholder="usuario o tu@email.com" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center mr-2">
                  <label className="text-[11px] font-bold text-[#52525B] uppercase tracking-wide ml-2">Contraseña</label>
                  <button type="button" onClick={() => { setMode('forgot_password'); setError(''); setSuccessMsg(''); }} className="text-[11px] font-bold text-[#8D96D6] hover:text-[#727CB5] transition-colors">¿Te olvidaste?</button>
                </div>
                <div className="relative">
                  <input 
                    required 
                    type={showPassword ? "text" : "password"} 
                    className={`w-full bg-[#E4E6F8] border-[1.5px] border-[#8D96D6] rounded-full pl-5 pr-12 py-3 text-sm text-[#3F3F46] outline-none focus:ring-2 focus:ring-[#727CB5] transition-all ${!showPassword ? 'tracking-widest' : ''} placeholder:tracking-normal`} 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8D96D6] hover:text-[#727CB5] transition-colors"
                    aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button disabled={loading} type="submit" className="w-full h-12 mt-2 text-[16px] rounded-full bg-[#7ac7ac] hover:bg-[#7ac7ac] hover:opacity-100 text-white font-bold border-0 transition-all shadow-none tracking-wide">
                {loading ? 'Cargando...' : 'Entrar'}
              </Button>
              
              <div className="text-center pt-2">
                <p className="text-[13px] text-[#333333] font-medium">
                  ¿No tenés cuenta?{' '}
                  <button type="button" onClick={onSwitchToRegister} className="text-[#8D96D6] font-extrabold hover:text-[#727CB5] transition-colors">Registrate</button>
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              {error && <div className="p-3 bg-red-100 text-red-600 text-sm rounded-xl text-center font-bold">{error}</div>}
              {successMsg && <div className="p-3 bg-green-100 text-green-700 text-sm rounded-xl text-center font-bold">{successMsg}</div>}
              
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#52525B] uppercase tracking-wide ml-2">Email de tu cuenta</label>
                <input 
                  required 
                  type="email" 
                  className="w-full bg-[#E4E6F8] border-[1.5px] border-[#8D96D6] rounded-full px-5 py-3 text-sm text-[#3F3F46] outline-none focus:ring-2 focus:ring-[#727CB5] transition-all" 
                  placeholder="tu@email.com" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                />
              </div>

              <Button disabled={loading || !!successMsg} type="submit" className="w-full h-12 mt-2 text-[16px] rounded-full bg-[#8D96D6] hover:bg-[#727CB5] text-white font-bold border-0 transition-all shadow-none tracking-wide">
                {loading ? 'Enviando...' : 'Enviar correo de recuperación'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
