import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/uiStore';

import { signIn } from '@/app/actions/auth';
import { getCurrentUser } from '@/app/actions/users';

export const LoginView = ({ onSwitchToRegister }: { onSwitchToRegister: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const login = useUIStore(state => state.login);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await signIn({ email, password });
      if (res.error) {
        setError(res.error);
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

  return (
    <div className="min-h-screen bg-[#DFD8F7] flex flex-col items-center justify-center py-10 px-4 font-sans">
      <div className="w-full max-w-[340px] rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col border-0">
        
        <div className="pt-10 pb-6 px-8 text-center bg-[#E4E6F8] flex flex-col items-center">
          <img src="/logo-planazo.png" alt="Logo Planazo" className="w-32 h-32 object-contain drop-shadow-sm -mb-4" />
          <h1 className="text-3xl font-extrabold text-[#3F3F46] tracking-normal mt-1">Planazo</h1>
          <p className="text-[#333333] text-sm mt-1">Encontrá gente para hacer planes. Rápido, fácil y en tu zona.</p>
        </div>

        <div className="bg-[#FAF8F2] px-7 pb-8 pt-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && <div className="p-3 bg-red-100 text-red-600 text-sm rounded-xl text-center font-bold">{error}</div>}
            
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#52525B] uppercase tracking-wide ml-2">Usuario o Email</label>
              {/* Borde base #8D96D6, focus más oscuro #727CB5 */}
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
              <label className="text-[11px] font-bold text-[#52525B] uppercase tracking-wide ml-2">Contraseña</label>
              <input 
                required 
                type="password" 
                className="w-full bg-[#E4E6F8] border-[1.5px] border-[#8D96D6] rounded-full px-5 py-3 text-sm text-[#3F3F46] outline-none focus:ring-2 focus:ring-[#727CB5] transition-all tracking-widest placeholder:tracking-normal" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
            </div>

            <Button disabled={loading} type="submit" className="w-full h-12 mt-2 text-[16px] rounded-full bg-[#7ac7ac] hover:bg-[#7ac7ac] hover:opacity-100 text-white font-bold border-0 transition-all shadow-none tracking-wide">
              {loading ? 'Cargando...' : 'Entrar'}
            </Button>
            
            <div className="text-center pt-2">
              <p className="text-[13px] text-[#333333] font-medium">
                ¿No tenés cuenta?{' '}
                {/* Texto base #8D96D6, hover más oscuro #727CB5 */}
                <button type="button" onClick={onSwitchToRegister} className="text-[#8D96D6] font-extrabold hover:text-[#727CB5] transition-colors">Registrate</button>
              </p>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};