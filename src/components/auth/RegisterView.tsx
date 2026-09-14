import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/uiStore';

import { signUp, signIn } from '@/app/actions/auth';
import { getCurrentUser, updateUserInterests } from '@/app/actions/users';

export const RegisterView = ({ onSwitchToLogin }: { onSwitchToLogin: () => void }) => {
  const regions = useUIStore(state => state.regions);
  const interests = useUIStore(state => state.interests);

  const [formData, setFormData] = useState({ 
    username: '', email: '', password: '', age: '', gender: 'X', region: regions[0]?.name || '', interests: [] as string[],
    avatarUrl: '', instagram: '', facebook: ''
  });
  
  useEffect(() => {
    if (!formData.region && regions.length > 0) {
      setFormData(prev => ({ ...prev, region: regions[0].name }));
    }
  }, [regions]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const login = useUIStore(state => state.login);

  const handleInterest = (interestId: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId) ? prev.interests.filter(x => x !== interestId) : [...prev.interests, interestId]
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError('');

    let newErrors: Record<string, string> = {};

    if (!formData.username.trim()) newErrors.username = 'Requerido';
    if (!formData.password) newErrors.password = 'Requerido';
    if (!formData.age) newErrors.age = 'Requerido';

    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$&*]).{8,}$/;
    if (formData.password && !passwordRegex.test(formData.password)) {
      newErrors.password = 'Debe tener al menos 8 caracteres, 1 mayúscula y 1 especial (!@#$&*)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setGlobalError('Por favor, completa correctamente los campos marcados en rojo.');
      return;
    }

    setLoading(true);

    try {
      const res = await signUp({
        email: formData.email,
        password: formData.password,
        username: formData.username,
        age: parseInt(formData.age),
        gender: formData.gender as 'F' | 'M' | 'X',
        region: formData.region
      });

      if (res.error) {
        setGlobalError(res.error);
        return;
      }

      const signInRes = await signIn({ email: formData.email, password: formData.password });
      if (signInRes.error) {
        setGlobalError(signInRes.error === 'Email not confirmed' 
          ? 'Por favor, confirma tu correo para entrar.' 
          : signInRes.error);
        return;
      }

      if (formData.interests.length > 0) {
        await updateUserInterests(formData.interests);
      }

      const userRes = await getCurrentUser();
      if (userRes) {
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
      } else {
        setGlobalError('Usuario creado pero no se pudo cargar la sesión. Intenta iniciar sesión manualmente.');
      }
    } catch (err: any) {
      setGlobalError('Error al crear cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, avatarUrl: url }));
    }
  };

  return (
    <div className="min-h-screen bg-[#F4DED4] flex flex-col items-center justify-center py-10 px-4">
      <div className="w-full max-w-lg bg-slate-100 border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 text-center border-b border-slate-100 shrink-0 bg-slate-50/50">
          <h1 className="text-3xl font-bold text-[#3F3F46] tracking-normal">Crear cuenta</h1>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <form onSubmit={handleRegister} noValidate className="space-y-6">
            
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#8D96D6] border-b border-slate-100 pb-2">1. Datos Básicos</h3>
              <div>
                <label className="text-xs font-bold text-[#52525B] uppercase tracking-wider block mb-1">Usuario</label>
                <input required className={`w-full bg-slate-100 border-[1.5px] ${errors.username ? 'border-rose-400 focus:ring-rose-500' : 'border-[#8D96D6] focus:ring-[#727CB5]'} rounded-xl px-4 py-3 text-sm text-[#3F3F46] outline-none focus:ring-2 transition-all placeholder:text-slate-400`} placeholder="Ej: maria99" value={formData.username} onChange={e => { setFormData({...formData, username: e.target.value}); setErrors({...errors, username: ''}); setGlobalError(''); }} />
                {errors.username && <p className="text-rose-500 text-[10px] mt-1 font-medium">{errors.username}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#52525B] uppercase tracking-wider block mb-1">Correo (Opcional)</label>
                  <input type="email" className="w-full bg-slate-100 border-[1.5px] border-[#8D96D6] rounded-xl px-4 py-3 text-sm text-[#3F3F46] outline-none focus:ring-2 focus:ring-[#727CB5] transition-all placeholder:text-slate-400" placeholder="tu@email.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#52525B] uppercase tracking-wider block mb-1">Contraseña</label>
                  <input required type="password" className={`w-full bg-slate-100 border-[1.5px] ${errors.password ? 'border-rose-400 focus:ring-rose-500' : 'border-[#8D96D6] focus:ring-[#727CB5]'} rounded-xl px-4 py-3 text-sm text-[#3F3F46] outline-none focus:ring-2 transition-all placeholder:text-slate-400`} placeholder="••••••••" value={formData.password} onChange={e => { setFormData({...formData, password: e.target.value}); setErrors({...errors, password: ''}); setGlobalError(''); }} />
                  {errors.password && <p className="text-rose-500 text-[10px] mt-1 font-medium">{errors.password}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#8D96D6] border-b border-slate-100 pb-2 mt-6">2. Tu Perfil Público</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#52525B] uppercase tracking-wider block mb-1">Edad</label>
                  <input required type="number" min="18" className={`w-full bg-slate-100 border-[1.5px] ${errors.age ? 'border-rose-400 focus:ring-rose-500' : 'border-[#8D96D6] focus:ring-[#727CB5]'} rounded-xl px-4 py-3 text-sm text-[#3F3F46] outline-none focus:ring-2 transition-all placeholder:text-slate-400`} placeholder="18+" value={formData.age} onChange={e => { setFormData({...formData, age: e.target.value}); setErrors({...errors, age: ''}); setGlobalError(''); }} />
                  {errors.age && <p className="text-rose-500 text-[10px] mt-1 font-medium">{errors.age}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-[#52525B] uppercase tracking-wider block mb-1">Género</label>
                  <select className="w-full bg-slate-100 border-[1.5px] border-[#8D96D6] rounded-xl px-4 py-3 text-sm text-[#3F3F46] outline-none focus:ring-2 focus:ring-[#727CB5] transition-all" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                    <option value="F">Mujer</option>
                    <option value="M">Hombre</option>
                    <option value="X">No Binario</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-[#52525B] uppercase tracking-wider block mb-1">Zona Principal</label>
                <select className="w-full bg-slate-100 border-[1.5px] border-[#8D96D6] rounded-xl px-4 py-3 text-sm text-[#3F3F46] outline-none focus:ring-2 focus:ring-[#727CB5] transition-all" value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})}>
                  {regions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#52525B] uppercase tracking-wider block mb-2">Intereses</label>
                <div className="flex flex-wrap gap-2">
                  {interests.map(i => (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => handleInterest(i.id)}
                      className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all border-[1.5] ${
                        formData.interests.includes(i.id) 
                          ? 'bg-[#8D96D6] border-[#8D96D6] text-white shadow-sm hover:bg-[#727CB5] hover:border-[#727CB5]' 
                          : 'bg-transparent border-[#8D96D6] text-[#52525B] hover:bg-[#E4E6F8]'
                      }`}
                    >
                      {i.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#8D96D6] border-b border-slate-100 pb-2 mt-6">3. Redes y Avatar (Opcional)</h3>
              <div>
                <label className="text-xs font-bold text-[#52525B] uppercase tracking-wider block mb-1">Foto de Perfil</label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-slate-100 rounded-full overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center text-slate-400">
                    {formData.avatarUrl ? (
                      <img src={formData.avatarUrl} alt="Avatar preview" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-2xl font-black">?</span>
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 transition-all cursor-pointer" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#52525B] uppercase tracking-wider block mb-1">Instagram</label>
                  <input className="w-full bg-slate-100 border-[1.5px] border-[#8D96D6] rounded-xl px-4 py-3 text-sm text-[#3F3F46] outline-none focus:ring-2 focus:ring-[#727CB5] transition-all placeholder:text-slate-400" placeholder="@usuario" value={formData.instagram} onChange={e => setFormData({...formData, instagram: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Button disabled={loading} type="submit" className="w-full h-12 text-[16px] rounded-full bg-[#7ac7ac] hover:bg-[#7ac7ac] text-white font-bold border-0 transition-all shadow-none">
                {loading ? 'Cargando...' : 'Registrarme y Entrar'}
              </Button>
              {globalError && (
                <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
                  <p className="text-rose-600 text-xs font-bold">{globalError}</p>
                </div>
              )}
            </div>
            
            <div className="text-center pt-6 border-t border-slate-100">
              <p className="text-sm text-slate-600 font-medium">
                ¿Ya tenés cuenta?{' '}
                <button type="button" onClick={onSwitchToLogin} className="text-[#8D96D6] font-black hover:text-[#727CB5] transition-colors">Iniciá sesión</button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};