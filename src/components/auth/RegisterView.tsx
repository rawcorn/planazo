import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/uiStore';
import { uploadImage } from '@/app/actions/storage';
import { Eye, EyeOff, ChevronDown } from 'lucide-react';

import { signUp, signIn, registerFullFlow } from '@/app/actions/auth';
import { getCurrentUser, updateUserInterests } from '@/app/actions/users';
import { signUpSchema } from '@/lib/validations';

export const RegisterView = ({ onSwitchToLogin }: { onSwitchToLogin: () => void }) => {
  const regions = useUIStore(state => state.regions);
  const interests = useUIStore(state => state.interests);

  const [formData, setFormData] = useState({ 
    username: '', email: '', password: '', age: '', gender: 'X', region: regions[0]?.name || '', interests: [] as string[],
    avatarUrl: '', avatarFile: null as File | null, instagram: '', /*@ts-ignore*/
// @ts-ignore
tiktok: '', facebook: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, avatarUrl: 'El archivo supera los 4MB' }));
        e.target.value = ''; // Limpiamos el input
        setFormData(prev => ({ ...prev, avatarUrl: '' })); // Borramos la foto anterior si había
        return;
      }
      // Limpiamos cualquier error de avatar si la foto es válida
      setErrors(prev => ({ ...prev, avatarUrl: '' }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_SIZE = 800; // Reducimos a 800px máximo
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Comprimir a JPEG con calidad 0.7 para que pase a pesar < 200KB
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          fetch(compressedBase64)
            .then(res => res.blob())
            .then(blob => {
               const newFile = new File([blob], file.name, { type: 'image/jpeg' });
               setFormData(prev => ({ ...prev, avatarUrl: compressedBase64, avatarFile: newFile }));
            });
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (errors.avatarUrl) {
      setGlobalError('Por favor, selecciona una foto más liviana antes de continuar.');
      return;
    }
    setErrors({});
    setGlobalError('');

    if (!formData.age) {
      setErrors({ age: 'La edad es obligatoria' });
      setGlobalError('La edad es obligatoria');
      return;
    }

    const parsed = signUpSchema.safeParse({
      ...formData,
      age: parseInt(formData.age)
    });

    if (!parsed.success) {
      const newErrs: Record<string, string> = {};
      parsed.error.issues.forEach(iss => {
        if (iss.path[0]) newErrs[iss.path[0].toString()] = iss.message;
      });
      setErrors(newErrs);
      if (newErrs.age) {
        setGlobalError('La edad es obligatoria');
      } else {
        setGlobalError('Hay errores en el formulario, por favor revisa los campos marcados.');
      }
      return;
    }

    setLoading(true);

    try {
      let finalAvatarUrl = formData.avatarUrl;
      if (formData.avatarFile) {
        try {
          const uploadFormData = new FormData();
          uploadFormData.append('file', formData.avatarFile);
          uploadFormData.append('bucket', 'avatars');
          const uploadedUrl = await uploadImage(uploadFormData);
          if (uploadedUrl) {
             finalAvatarUrl = uploadedUrl;
          }
        } catch (e: any) {
          console.error("Upload Image Error:", e);
          setGlobalError('No se pudo subir la foto de perfil. Intenta con una imagen más liviana (Máx. 4MB).');
          setLoading(false);
          return;
        }
      }

      let res;
      try {
        res = await registerFullFlow({
          ...parsed.data,
          avatarUrl: finalAvatarUrl,
          instagram: formData.instagram,
            // @ts-ignore
tiktok: formData.tiktok,
            facebook: formData.facebook
        }, formData.interests);
      } catch (e: any) {
        console.error("Register Error:", e);
        setGlobalError('Fallo de conexión en Vercel. Asegúrate de haber agregado NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en las Environment Variables de tu proyecto en Vercel.');
        setLoading(false);
        return;
      }

      if (res.error) {
        if (res.step === 'signup' && (res.error.includes('ya estén en uso') || res.error.includes('ya esté en uso') || res.error.includes('already registered') || res.error.includes('Database error'))) {
          if (formData.email) {
            setErrors(prev => ({
              ...prev,
              email: 'Email en uso'
            }));
            setGlobalError('El email ya está registrado.');
          } else {
            setErrors(prev => ({
              ...prev,
              username: 'Usuario no disponible'
            }));
            setGlobalError('El usuario ya está registrado.');
          }
          return;
        } else if (res.step === 'signin') {
          setGlobalError('Tu cuenta fue creada, pero hubo un problema al iniciar sesión. Por favor, iniciá sesión manualmente.');
          return;
        }
        setGlobalError(res.error);
        return;
      }

      let userRes;
      try {
        userRes = await getCurrentUser();
      } catch (e: any) {
        console.error("GetCurrentUser Error:", e);
        setGlobalError('Error en Vercel al cargar el usuario. Por favor, asegúrate de que las variables de entorno de Supabase estén bien copiadas.');
        setLoading(false);
        return;
      }

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
            // @ts-ignore
tiktok: userRes.tiktok || '',
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
      } else {
        setGlobalError('Usuario creado pero no se pudo cargar la sesión. Intenta iniciar sesión manualmente.');
      }
    } catch (err: any) {
      console.error(err);
      setGlobalError('Error interno inesperado en Vercel. Verifica los logs de Vercel en la pestaña "Runtime Logs".');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-[#F4DED4] flex flex-col items-center justify-start md:justify-center py-8 md:py-10 px-4">
      <div className="w-full max-w-lg bg-slate-100 border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 text-center border-b border-slate-100 shrink-0 bg-slate-50/50">
          <h1 className="text-3xl font-bold text-[#3F3F46] tracking-normal">Crear cuenta</h1>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <form onSubmit={handleRegister} noValidate className="space-y-6">
            
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#8D96D6] border-b border-slate-100 pb-2">1. Datos Básicos</h3>
              <div>
                <label className="text-xs font-bold text-[#52525B] ml-2 uppercase tracking-wider block mb-1">Usuario</label>
                <input required className={`w-full bg-slate-100 border-[1.5px] ${errors.username ? 'border-rose-400 focus:ring-rose-500' : 'border-[#8D96D6] focus:ring-[#727CB5]'} rounded-xl px-4 py-3 text-sm text-[#3F3F46] outline-none focus:ring-2 transition-all placeholder:text-slate-400`} placeholder="Ej: maria99" value={formData.username} onChange={e => { setFormData({...formData, username: e.target.value}); setErrors({...errors, username: ''}); setGlobalError(''); }} />
                {errors.username && <p className="text-rose-500 text-[10px] mt-1 font-medium">{errors.username}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#52525B] ml-2 tracking-wider block mb-1"><span className="uppercase">Correo</span> <span className="normal-case">(Opcional)</span></label>
                  <input type="email" className={`w-full bg-slate-100 border-[1.5px] ${errors.email ? 'border-rose-400 focus:ring-rose-500' : 'border-[#8D96D6] focus:ring-[#727CB5]'} rounded-xl px-4 py-3 text-sm text-[#3F3F46] outline-none focus:ring-2 transition-all placeholder:text-slate-400`} placeholder="tu@email.com" value={formData.email} onChange={e => { setFormData({...formData, email: e.target.value}); setErrors({...errors, email: ''}); setGlobalError(''); }} />
                    <p className="text-slate-400 text-[10px] mt-1 ml-2 leading-tight">Solo lo usaremos para recuperar tu cuenta si olvidás tu contraseña.</p>
                    {errors.email && <p className="text-rose-500 text-[10px] mt-1 font-medium">{errors.email}</p>}
                  </div>
                <div>
                  <label className="text-xs font-bold text-[#52525B] ml-2 uppercase tracking-wider block mb-1">Contraseña</label>
                  <div className="relative">
                    <input required type={showPassword ? "text" : "password"} className={`w-full bg-slate-100 border-[1.5px] ${errors.password ? 'border-rose-400 focus:ring-rose-500' : 'border-[#8D96D6] focus:ring-[#727CB5]'} rounded-xl px-4 pr-10 py-3 text-sm text-[#3F3F46] outline-none focus:ring-2 transition-all placeholder:text-slate-400`} placeholder="••••••••" value={formData.password} onChange={e => { setFormData({...formData, password: e.target.value}); setErrors({...errors, password: ''}); setGlobalError(''); }} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8D96D6] hover:text-[#727CB5] transition-colors"
                      aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-slate-400 text-[10px] mt-1 ml-2 leading-tight">Mínimo 8 caracteres, 1 mayúscula y 1 caracter especial.</p>
                    {errors.password && <p className="text-rose-500 text-[10px] mt-1 font-medium">{errors.password}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#8D96D6] border-b border-slate-100 pb-2 mt-6">2. Tu Perfil Público</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#52525B] ml-2 uppercase tracking-wider block mb-1">Edad</label>
                  <input required type="number" min="18" className={`w-full bg-slate-100 border-[1.5px] ${errors.age ? 'border-rose-400 focus:ring-rose-500' : 'border-[#8D96D6] focus:ring-[#727CB5]'} rounded-xl px-4 py-3 text-sm text-[#3F3F46] outline-none focus:ring-2 transition-all placeholder:text-slate-400`} placeholder="18+" value={formData.age} onChange={e => { setFormData({...formData, age: e.target.value}); setErrors({...errors, age: ''}); setGlobalError(''); }} />
                  {errors.age && <p className="text-rose-500 text-[10px] mt-1 font-medium">{errors.age}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-[#52525B] ml-2 uppercase tracking-wider block mb-1">Género</label>
                  <div className="relative">
                      <select className={`w-full appearance-none bg-slate-100 border-[1.5px] ${errors.gender ? 'border-rose-400 focus:ring-rose-500' : 'border-[#8D96D6] focus:ring-[#727CB5]'} rounded-xl pl-4 pr-10 py-3 text-sm text-[#3F3F46] outline-none focus:ring-2 transition-all`} value={formData.gender} onChange={e => { setFormData({...formData, gender: e.target.value}); setErrors({...errors, gender: ''}); setGlobalError(''); }}>
                    <option value="F">Mujer</option>
                    <option value="M">Hombre</option>
                    <option value="X">No Binario</option>
                  </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                    </div>
                    <p className="text-slate-400 text-[10px] mt-1 ml-2 leading-tight">Pedimos este dato solo para sugerirte planes que se ajusten a vos.</p>
                    {errors.gender && <p className="text-rose-500 text-[10px] mt-1 font-medium">{errors.gender}</p>}
                  </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-[#52525B] ml-2 uppercase tracking-wider block mb-1">Tu Zona</label>
                <div className="relative">
                  <select className={`w-full appearance-none bg-slate-100 border-[1.5px] ${errors.region ? 'border-rose-400 focus:ring-rose-500' : 'border-[#8D96D6] focus:ring-[#727CB5]'} rounded-xl pl-4 pr-10 py-3 text-sm text-[#3F3F46] outline-none focus:ring-2 transition-all`} value={formData.region} onChange={e => { setFormData({...formData, region: e.target.value}); setErrors({...errors, region: ''}); setGlobalError(''); }}>
                  {regions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                </div>
                {errors.region && <p className="text-rose-500 text-[10px] mt-1 font-medium">{errors.region}</p>}
              </div>

              <div>
                <label className="text-xs font-bold text-[#52525B] ml-2 uppercase tracking-wider block mb-2">Intereses</label>
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
              <h3 className="text-sm font-bold text-[#8D96D6] border-b border-slate-100 pb-2 mt-6">3. Redes y Avatar</h3>
              <div>
                <label className="text-xs font-bold text-[#52525B] ml-2 tracking-wider block mb-1">
                  <span className="uppercase">Foto de Perfil</span> <span className="normal-case">(Opcional)</span>
                </label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-slate-100 rounded-full overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center text-slate-400">
                    {formData.avatarUrl ? (
                      <img src={formData.avatarUrl} alt="Avatar preview" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-2xl font-black">?</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 transition-all cursor-pointer" />
                    {errors.avatarUrl ? (
                      <p className="text-[10px] text-rose-500 mt-1.5 ml-4 font-bold uppercase tracking-wider">{errors.avatarUrl}</p>
                    ) : (
                      <p className="text-[10px] text-slate-400 mt-1.5 ml-4 font-medium tracking-wide">Max. 4MB</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#52525B] ml-2 tracking-wider block mb-1"><span className="uppercase">Instagram</span> <span className="normal-case">(Opcional)</span></label>
                    <input className="w-full bg-slate-100 border-[1.5px] border-[#8D96D6] rounded-xl px-4 py-3 text-sm text-[#3F3F46] outline-none focus:ring-2 focus:ring-[#727CB5] transition-all placeholder:text-slate-400" placeholder="@usuario" value={formData.instagram} onChange={e => setFormData({...formData, instagram: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#52525B] ml-2 tracking-wider block mb-1"><span className="uppercase">TikTok</span> <span className="normal-case">(Opcional)</span></label>
                    <input className="w-full bg-slate-100 border-[1.5px] border-[#8D96D6] rounded-xl px-4 py-3 text-sm text-[#3F3F46] outline-none focus:ring-2 focus:ring-[#727CB5] transition-all placeholder:text-slate-400" placeholder="@usuario" value={formData.tiktok} onChange={e => setFormData({...formData, // @ts-ignore
tiktok: e.target.value})} />
                  </div>
                </div>
            </div>

            <div className="mt-6">
              <Button disabled={loading} type="submit" className="w-full h-12 text-[16px] rounded-full bg-[#7ac7ac] hover:bg-[#7ac7ac] text-white font-bold border-0 transition-all shadow-none">
                {loading ? 'Cargando...' : 'Registrarme y Entrar'}
              </Button>
              {globalError && <p className="text-rose-500 text-[10px] mt-1 font-medium text-center">{globalError}</p>}
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