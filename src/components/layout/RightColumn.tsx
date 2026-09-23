import React, { useState, useEffect } from 'react'
import { useUIStore } from '@/store/uiStore'
import { Button } from '@/components/ui/button'
import { ChevronLeft, MapPin, User, AtSign, Link as LinkIcon, AlertTriangle, Clock, Users, ExternalLink, Plus, X, ArrowLeft, Moon, Camera, LogOut } from 'lucide-react'
import { DatePicker } from '@/components/ui/DatePicker'
import { IosTimePicker } from '@/components/ui/IosTimePicker'
import { useShallow } from 'zustand/react/shallow'

export function RightColumn() {
  const { 
    currentUser, 
    users, 
    events, 
    regions,
    interests,
    activeRoomId, 
    activeView, 
    setMobileView, 
    selectedUserId, 
    selectedEventId, 
    resetRightColumn,
    setSelectedUser,
    setSelectedEvent,
    joinEvent,
    leaveEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    duplicateWarning,
    setDuplicateWarning,
    setRightColumnView,
    startDirectMessage,
    logout
  } = useUIStore(useShallow(state => ({
    currentUser: state.currentUser,
    users: state.users,
    events: state.events,
    regions: state.regions,
    interests: state.interests,
    activeRoomId: state.activeRoomId,
    activeView: state.activeView,
    setMobileView: state.setMobileView,
    selectedUserId: state.selectedUserId,
    selectedEventId: state.selectedEventId,
    resetRightColumn: state.resetRightColumn,
    setSelectedUser: state.setSelectedUser,
    setSelectedEvent: state.setSelectedEvent,
    joinEvent: state.joinEvent,
    leaveEvent: state.leaveEvent,
    createEvent: state.createEvent,
    updateEvent: state.updateEvent,
    deleteEvent: state.deleteEvent,
    duplicateWarning: state.duplicateWarning,
    setDuplicateWarning: state.setDuplicateWarning,
    setRightColumnView: state.setRightColumnView,
    startDirectMessage: state.startDirectMessage,
    logout: state.logout
  })))

  const defaultRegionId = regions.find(r => r.name === currentUser?.region)?.id || regions[0]?.id || '';
  
  const [newPlan, setNewPlan] = useState({ 
    title: '', description: '', region: defaultRegionId, interest: interests[0]?.id || '', 
    date: '', hour: '', minute: '', maxAttendees: '', address: '', ageMin: '', ageMax: '', genderPreference: 'Todos' as 'Todos' | 'Solo mujeres' | 'Solo hombres', imageUrl: '', imageFile: null as File | null
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formErrorField, setFormErrorField] = useState<string | null>(null);

  // Ensure newPlan has valid defaults if it loaded before catalogs
  useEffect(() => {
    if (!newPlan.region && defaultRegionId) setNewPlan(p => ({ ...p, region: defaultRegionId }));
    if (!newPlan.interest && interests[0]?.id) setNewPlan(p => ({ ...p, interest: interests[0].id }));
  }, [regions, interests, defaultRegionId])

  // Reset form and set region when opening create event view
  useEffect(() => {
    if (activeView === 'create_event') {
      const activeRegObj = regions.find(r => r.room_id === activeRoomId);
      const activeEv = events.find(e => e.id === activeRoomId);
      const contextRegionId = activeEv ? activeEv.region : activeRegObj?.id;
      const rId = contextRegionId || defaultRegionId;
      setNewPlan({ 
        title: '', description: '', region: rId, interest: interests[0]?.id || '', 
        date: '', hour: '', minute: '', maxAttendees: '', address: '', ageMin: '', ageMax: '', genderPreference: 'Todos', imageUrl: '', imageFile: null
      });
      setFormError(null);
      setFormErrorField(null);
    } else if (activeView === 'edit_event' && selectedEventId) {
      const evToEdit = events.find(e => e.id === selectedEventId);
      if (evToEdit) {
        const d = new Date(evToEdit.date);
        setNewPlan({
          title: evToEdit.title,
          description: evToEdit.description,
          region: evToEdit.region,
          interest: evToEdit.interest,
          date: d.toISOString().split('T')[0],
          hour: d.getHours().toString().padStart(2, '0'),
          minute: d.getMinutes().toString().padStart(2, '0'),
          maxAttendees: evToEdit.maxAttendees ? evToEdit.maxAttendees.toString() : '',
          address: evToEdit.address || '',
          ageMin: evToEdit.ageMin ? evToEdit.ageMin.toString() : '',
          ageMax: evToEdit.ageMax ? evToEdit.ageMax.toString() : '',
          genderPreference: evToEdit.genderPreference,
          imageUrl: evToEdit.imageUrl || '',
          imageFile: null
        });
        setFormError(null);
        setFormErrorField(null);
      }
    }
  }, [activeView, activeRoomId, regions, events, defaultRegionId, interests, selectedEventId]);

  if (!currentUser) return null;

  const getUser = (id: string) => {
    if (currentUser && id === currentUser.id) return currentUser;
    return users.find(u => u.id === id) || { username: 'Usuario Desconocido', avatarUrl: '', interests: [] as string[], age: 0, gender: 'X', region: '', instagram: '', facebook: '' } as any;
  }

  const activeRegionObj = regions.find(r => r.room_id === activeRoomId);
  const isRegionRoom = !!activeRegionObj;
  const isEventRoom = !isRegionRoom && events.some(e => e.id === activeRoomId);
  
  const activeEvent = isEventRoom ? events.find(e => e.id === activeRoomId) : null;
  const currentRegionIdContext = activeEvent ? activeEvent.region : activeRegionObj?.id;
  const currentRegionName = activeRegionObj ? activeRegionObj.name : (activeEvent ? regions.find(r => r.id === activeEvent.region)?.name : '');

  const regionEvents = events
    .filter(e => e.region === currentRegionIdContext)
    .filter(e => new Date(e.date) > new Date(Date.now() - 6 * 60 * 60 * 1000))
    .filter(e => {
      if (e.creatorId === currentUser.id) return true;
      if (e.genderPreference === 'Solo mujeres' && currentUser.gender !== 'F') return false;
      if (e.genderPreference === 'Solo hombres' && currentUser.gender !== 'M') return false;
      return true;
    })
    .sort((a, b) => {
      // Find interest names for matching
      const aInterestName = interests.find(i => i.id === a.interest)?.name;
      const bInterestName = interests.find(i => i.id === b.interest)?.name;
      
      const aMatch = aInterestName && currentUser.interests?.includes(aInterestName);
      const bMatch = bInterestName && currentUser.interests?.includes(bInterestName);
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

  const eventToShow = selectedEventId ? events.find(e => e.id === selectedEventId) : (isEventRoom ? activeEvent : null);
  const profileToShow = selectedUserId ? getUser(selectedUserId) : null;

  const executeCreation = async () => {
    setFormError(null);
    setFormErrorField(null);
    const eventDateTime = new Date(`${newPlan.date}T${newPlan.hour}:${newPlan.minute}`);
    const planToCreate = {
      ...newPlan,
      date: eventDateTime.toISOString(),
      maxAttendees: newPlan.maxAttendees ? parseInt(newPlan.maxAttendees) : null,
      ageMin: newPlan.ageMin ? parseInt(newPlan.ageMin) : null,
      ageMax: newPlan.ageMax ? parseInt(newPlan.ageMax) : null,
    };

    let res;
    if (activeView === 'edit_event' && selectedEventId) {
      res = await updateEvent(selectedEventId, planToCreate);
    } else {
      res = await createEvent(planToCreate);
    }

    if (res.id) {
      setDuplicateWarning(null);
      setSelectedEvent(res.id);
      setRightColumnView('event_details');
      setNewPlan({ title: '', description: '', region: defaultRegionId, interest: interests[0]?.id || '', date: '', hour: '', minute: '', maxAttendees: '', address: '', ageMin: '', ageMax: '', genderPreference: 'Todos', imageUrl: '', imageFile: null });
    } else if (res.error) {
      setFormError(res.error);
      if (res.error.toLowerCase().includes('título')) setFormErrorField('title');
      else if (res.error.toLowerCase().includes('fecha')) setFormErrorField('date');
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormErrorField(null);
    
    if (!newPlan.title.trim()) {
      setFormError('Por favor, ingresa un título para el planazo.');
      setFormErrorField('title');
      return;
    }
    if (!newPlan.date) {
      setFormError('Por favor, selecciona una fecha en el calendario.');
      setFormErrorField('date');
      return;
    }
    if (!newPlan.hour || !newPlan.minute) {
       setFormError('Por favor, selecciona la hora del evento.');
       setFormErrorField('time');
       return;
    }

    const eventDateTime = new Date(`${newPlan.date}T${newPlan.hour}:${newPlan.minute}`);
    if (eventDateTime.getTime() < Date.now()) {
      setFormError('El horario no puede ser en el pasado. ¡Elegí uno a futuro!');
      setFormErrorField('time');
      return;
    }
    
    const isDuplicate = events.find(ev => {
      if (activeView === 'edit_event' && selectedEventId === ev.id) return false;
      if (ev.region !== newPlan.region) return false;
      const timeDiffHours = Math.abs(new Date(ev.date).getTime() - eventDateTime.getTime()) / (1000 * 60 * 60);
      
      const sameAddress = ev.address && newPlan.address && ev.address.toLowerCase().trim() === newPlan.address.toLowerCase().trim();
      const titleWords = newPlan.title.toLowerCase().split(' ').filter(w => w.length > 3);
      const similarTitle = titleWords.length > 0 && titleWords.some(w => ev.title.toLowerCase().includes(w));
      
      return (sameAddress || similarTitle) && timeDiffHours <= 3; 
    });

    if (isDuplicate) {
      setDuplicateWarning(isDuplicate);
    } else {
      executeCreation();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_SIZE = 1000;
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
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          fetch(compressedBase64)
            .then(res => res.blob())
            .then(blob => {
               const newFile = new File([blob], file.name, { type: 'image/jpeg' });
               setNewPlan({ ...newPlan, imageFile: newFile, imageUrl: compressedBase64 });
            });
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-100 text-slate-900">
      {/* HEADER */}
      <div className="h-16 px-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {activeView === 'create_event' ? (
            <button onClick={resetRightColumn} className="p-1.5 -ml-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={() => {
              resetRightColumn();
              setMobileView('chat');
            }} className="lg:hidden p-1.5 -ml-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-all">
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            {activeView === 'profile' ? 'Perfil de Usuario' : 
             activeView === 'create_event' ? 'Armar un Plan' : 
             activeView === 'event_details' ? 'Detalles del Plan' : 
             `Planes en ${currentRegionName}`}
          </h2>
        </div>
        <div className="flex gap-2">
          {(activeView === 'create_event' || activeView === 'edit_event' || activeView === 'event_details' || activeView === 'profile') && (
            <button onClick={resetRightColumn} className={`p-1.5 rounded-lg transition-colors ${(activeView === 'create_event' || activeView === 'edit_event') ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'} ${activeView === 'profile' ? 'hidden lg:flex' : ''}`}>
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6 bg-slate-100">
        
        {/* PERFIL */}
        {activeView === 'profile' && profileToShow && (
          <div className="space-y-6">
            <div className="text-center pt-2">
              {profileToShow.avatarUrl ? (
                <img src={profileToShow.avatarUrl} alt={profileToShow.username} className="h-32 w-32 rounded-full mx-auto mb-5 object-cover border-4 border-slate-50 shadow-sm" />
              ) : (
                <div className="h-32 w-32 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-5xl font-black mx-auto mb-5 border-4 border-slate-50 shadow-sm">
                  {profileToShow.username.charAt(0).toUpperCase()}
                </div>
              )}
              <h3 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">{profileToShow.username}</h3>
              <p className="text-sm font-medium text-slate-600 flex items-center justify-center gap-2">
                 <span>{profileToShow.age} años</span> • 
                 <span>{profileToShow.gender === 'F' ? 'Mujer' : profileToShow.gender === 'M' ? 'Hombre' : 'No Binario'}</span> • 
                 <span className="flex items-center gap-1"><MapPin className="h-3 w-3"/>{profileToShow.region}</span>
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                <User className="h-4 w-4 text-sky-500" /> Intereses
              </h4>
              <div className="flex flex-wrap gap-2">
                {profileToShow.interests.length > 0 ? profileToShow.interests.map((i: string) => (
                  <span key={i} className="bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                    {i}
                  </span>
                )) : (
                  <span className="text-sm text-slate-600 italic">No especificó intereses.</span>
                )}
              </div>
            </div>

            {(profileToShow.instagram || profileToShow.facebook) && (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Redes Sociales</h4>
                {profileToShow.instagram && (
                  <a href={`https://instagram.com/${profileToShow.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:border-pink-300 hover:text-pink-600 transition-colors font-bold text-sm">
                    <svg className="h-5 w-5 text-pink-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                    </svg>
                    {profileToShow.instagram.replace('@', '')}
                  </a>
                )}
                {profileToShow.facebook && (
                  <a href={profileToShow.facebook.includes('http') ? profileToShow.facebook : `https://facebook.com/${profileToShow.facebook}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-colors font-bold text-sm">
                    <LinkIcon className="h-5 w-5 text-blue-500" /> Perfil de Facebook
                  </a>
                )}
              </div>
            )}

            {currentUser.id !== profileToShow.id ? (
              <div className="pt-4">
                <Button className="w-full py-3.5" onClick={() => startDirectMessage(profileToShow.id)}>
                  Enviar Mensaje Privado
                </Button>
              </div>
            ) : (
              <div className="pt-4">
                <Button variant="ghost" className="w-full py-3.5 text-slate-500 hover:text-slate-800" onClick={logout}>
                  <LogOut className="h-5 w-5 mr-2" /> Cerrar Sesión
                </Button>
              </div>
            )}
          </div>
        )}

        {/* CREAR / EDITAR EVENTO */}
        {(activeView === 'create_event' || activeView === 'edit_event') && (
          <div className="relative">
            {duplicateWarning && (
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl mb-6">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-rose-700">¡Plan similar creado!</p>
                    <p className="text-xs text-rose-600 mt-1 mb-4">Ya existe &quot;{duplicateWarning.title}&quot; cerca de ese horario o lugar. ¿Quieres proponer el tuyo de todos modos?</p>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" className="flex-1 py-2 text-xs" onClick={() => setDuplicateWarning(null)}>Editar</Button>
                      <Button type="button" variant="danger" className="flex-1 py-2 text-xs" onClick={executeCreation}>Publicar igual</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="flex justify-center mb-6 relative w-24 mx-auto">
                <label className="relative cursor-pointer group block">
                  <div className="h-24 w-24 rounded-2xl bg-blue-50 border-2 border-dashed border-blue-200 flex flex-col items-center justify-center text-sky-500 group-hover:bg-blue-100 group-hover:border-blue-300 transition-colors overflow-hidden">
                    {newPlan.imageUrl ? (
                      <img src={newPlan.imageUrl} alt="Plan" className="h-full w-full object-cover" />
                    ) : (
                      <>
                        <Camera className="h-6 w-6 mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider flex flex-col items-center">
                          Foto
                          <span className="text-slate-400 font-normal lowercase mt-0.5">(Opcional)</span>
                        </span>
                      </>
                    )}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                {newPlan.imageUrl && (
                  <button type="button" onClick={() => setNewPlan({ ...newPlan, imageUrl: '', imageFile: null })} className="absolute top-1.5 right-1.5 bg-white/80 text-slate-500 rounded-full p-1.5 hover:bg-white hover:text-rose-500 shadow-sm backdrop-blur-sm transition-all z-10">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Título corto y directo</label>
                <input 
                  className={`w-full bg-slate-100 border rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400 ${formErrorField === 'title' ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200'}`} 
                  placeholder="Ej: Bar Boliche en Plaza Serrano..." 
                  value={newPlan.title} 
                  onChange={e => { setNewPlan({...newPlan, title: e.target.value}); if (formErrorField === 'title') { setFormError(null); setFormErrorField(null); } }} 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">De qué va la onda <span className="text-slate-400 font-normal lowercase">(Opcional)</span></label>
                <textarea className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 min-h-[100px] resize-none focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400" placeholder="Contanos más..." value={newPlan.description} onChange={e => setNewPlan({...newPlan, description: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Dirección Exacta <span className="text-slate-400 font-normal lowercase">(Opcional)</span></label>
                <input className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400" placeholder="Ej: El Salvador 1234" value={newPlan.address} onChange={e => setNewPlan({...newPlan, address: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Zona</label>
                <select className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={newPlan.region} onChange={e => setNewPlan({...newPlan, region: e.target.value})}>
                  {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Categoría (Interés)</label>
                <select className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={newPlan.interest} onChange={e => setNewPlan({...newPlan, interest: e.target.value})}>
                  {interests.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Preferencia de asistentes</label>
                <select className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={newPlan.genderPreference} onChange={e => setNewPlan({...newPlan, genderPreference: e.target.value as 'Todos' | 'Solo mujeres' | 'Solo hombres'})}>
                  <option value="Todos">Mixto / Para todos</option>
                  <option value="Solo mujeres">Solo mujeres</option>
                  <option value="Solo hombres">Solo hombres</option>
                </select>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Fecha</label>
                  <DatePicker 
                    value={newPlan.date} 
                    onChange={(d) => { setNewPlan({...newPlan, date: d}); if (formErrorField === 'date' || formErrorField === 'time') { setFormError(null); setFormErrorField(null); } }} 
                    hasError={formErrorField === 'date'} 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Horario</label>
                  <IosTimePicker 
                    hour={newPlan.hour} 
                    minute={newPlan.minute} 
                    onHourChange={(h) => { setNewPlan({...newPlan, hour: h}); if (formErrorField === 'time') { setFormError(null); setFormErrorField(null); } }}
                    onMinuteChange={(m) => { setNewPlan({...newPlan, minute: m}); if (formErrorField === 'time') { setFormError(null); setFormErrorField(null); } }}
                    selectedDate={newPlan.date}
                    hasError={formErrorField === 'time'}
                  />
                </div>
              </div>

              <div className="pt-4 space-y-2 flex flex-col items-center">
                <Button type="submit" className="w-full py-3.5 bg-[#9fbdd0] hover:bg-[#86aec6] text-slate-900 shadow-sm font-bold transition-all" disabled={duplicateWarning !== null}>
                  {activeView === 'edit_event' ? 'Guardar Cambios' : 'Lanzar Planazo'}
                </Button>
                {formError && (
                  <div className="text-slate-500 text-xs flex items-center gap-1.5 pt-1 animate-in fade-in duration-200">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                    <span>{formError}</span>
                  </div>
                )}
              </div>
            </form>
          </div>
        )}

        {/* DETALLES DE EVENTO */}
        {activeView === 'event_details' && eventToShow && (
          <div className="space-y-6">
            <Button onClick={resetRightColumn} variant="ghost" className="w-full justify-start text-sm -ml-2">
              <ChevronLeft className="h-4 w-4" /> Volver a los planes
            </Button>
            
            <div className="text-center pt-2">
              <div className="h-20 w-20 bg-blue-100 text-blue-800 rounded-2xl flex items-center justify-center text-4xl font-black mx-auto mb-4 border border-blue-200 shadow-sm overflow-hidden relative">
                {eventToShow.imageUrl ? (
                  <img src={eventToShow.imageUrl} alt={eventToShow.title} className="h-full w-full object-cover" />
                ) : (
                  eventToShow.title.charAt(0)
                )}
                {!eventToShow.imageUrl && (
                  <div className="absolute bottom-1 right-1 opacity-20">
                    <Camera className="h-6 w-6" />
                  </div>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 tracking-tight leading-snug">{eventToShow.title}</h3>
              <span className="inline-block bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                {interests.find(i => i.id === eventToShow.interest)?.name || 'Interés'}
              </span>
            </div>

            {eventToShow.attendees.includes(currentUser.id) ? (
              <div className="bg-indigo-50 p-5 rounded-2xl text-center border border-indigo-200 shadow-sm space-y-3">
                <p className="text-indigo-700 font-bold mb-2">¡Ya estás adentro!</p>
                {eventToShow.creatorId !== currentUser.id && (
                  <Button variant="danger" className="w-full py-3" onClick={() => leaveEvent(eventToShow.id)}>Bajarme del plan</Button>
                )}
              </div>
            ) : (
              <Button className="w-full py-3.5 shadow-sm" onClick={() => { joinEvent(eventToShow.id); resetRightColumn(); }}>
                Sumarme al Planazo
              </Button>
            )}

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-6">
              <p className="text-slate-700 text-sm leading-relaxed">"{eventToShow.description}"</p>
              
              <div className="pt-5 border-t border-slate-200 space-y-4">
                <div className="flex items-start gap-4 text-sm">
                  <div className="p-2 bg-slate-100 rounded-lg border border-slate-200 text-sky-500 shrink-0">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Cuándo</p>
                    <p className="text-slate-900 font-medium">{new Date(eventToShow.date).toLocaleString('es-AR', { weekday: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 text-sm">
                  <div className="p-2 bg-slate-100 rounded-lg border border-slate-200 text-sky-500 shrink-0">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Dónde</p>
                    <p className="text-slate-900 font-medium">{regions.find(r => r.id === eventToShow.region)?.name || 'Zona'}{eventToShow.address ? ` - ${eventToShow.address}` : ''}</p>
                    {eventToShow.address && (
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(eventToShow.address + ', ' + (regions.find(r => r.id === eventToShow.region)?.name || ''))}`} target="_blank" rel="noopener noreferrer" className="text-blue-800 hover:text-blue-900 inline-flex items-center gap-1.5 mt-2 font-bold bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                        Ver en Google Maps <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between mb-4 px-1">
                <p className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Users className="h-4 w-4 text-sky-500" />
                  Asistentes ({eventToShow.attendees.length})
                </p>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded-full">Sin restricción</span>
              </div>
              <div className="bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                {eventToShow.attendees.map((attendeeId, index) => {
                  const u = getUser(attendeeId);
                  return (
                    <div 
                      key={`${attendeeId}-${index}`} 
                      className="flex items-center gap-4 p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedUser(attendeeId)}
                    >
                      {u.avatarUrl ? (
                         <img src={u.avatarUrl} alt={u.username} className="h-10 w-10 rounded-full object-cover border border-slate-200" />
                      ) : (
                         <div className="h-10 w-10 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600">
                           {u.username.charAt(0).toUpperCase()}
                         </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">@{u.username}</p>
                        <p className="text-xs text-slate-600">{u.age} años • {u.gender}</p>
                      </div>
                      {attendeeId === eventToShow.creatorId && (
                        <span className="text-[10px] bg-blue-100 text-blue-900 px-2 py-1 rounded-md font-bold uppercase tracking-wider">Creador</span>
                      )}
                    </div>
                  );
                })}
              </div>
              </div>
            </div>

            {eventToShow.creatorId === currentUser.id && (
              <div className="pt-8 pb-4 flex items-center justify-center gap-6">
                <button onClick={() => setRightColumnView('edit_event')} className="text-sm text-slate-500 hover:text-slate-800 font-medium underline underline-offset-4 decoration-slate-300 hover:decoration-slate-800 transition-colors">
                  Editar planazo
                </button>
                <span className="text-slate-300">|</span>
                <button onClick={async () => {
                  if (window.confirm('¿Seguro que querés eliminar este planazo?')) {
                    await deleteEvent(eventToShow.id);
                    resetRightColumn();
                  }
                }} className="text-sm text-slate-500 hover:text-rose-600 font-medium underline underline-offset-4 decoration-slate-300 hover:decoration-rose-600 transition-colors">
                  Eliminar planazo
                </button>
              </div>
            )}
          </div>
        )}

        {/* CARTELERA */}
        {activeView === 'cartelera' && (
          <div className="space-y-6">
            <Button className="w-full py-3.5 shadow-sm" onClick={() => setRightColumnView('create_event')}>
              <Plus className="h-5 w-5" /> Armar un Planazo
            </Button>
            
            {regionEvents.length === 0 ? (
              <div className="text-center py-16 text-slate-600">
                <div className="bg-sky-100 border border-sky-200 h-20 w-20 rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-sm text-4xl">
                  🏖️
                </div>
                <p className="font-bold text-slate-900 text-lg">No hay planes próximos en esta zona.</p>
                <p className="text-sm mt-1">¡Sé el primero en armar uno!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {regionEvents.map(event => {
                  const isAttending = event.attendees.includes(currentUser.id);
                  const interestName = interests.find(i => i.id === event.interest)?.name;
                  const isRecommended = !isAttending && interestName && currentUser.interests?.includes(interestName);
                  
                  const pastelColors = [
                    'bg-sky-100 border-sky-200',
                    'bg-cyan-100 border-cyan-200',
                    'bg-indigo-50 border-indigo-100',
                    'bg-rose-100 border-rose-200',
                    'bg-orange-100 border-orange-200'
                  ];
                  const cardColor = pastelColors[event.title.length % pastelColors.length];

                  return (
                    <div 
                      key={event.id} 
                      onClick={() => setSelectedEvent(event.id)}
                      className={`p-5 rounded-[2rem] cursor-pointer transition-shadow border relative overflow-hidden ${cardColor} ${
                        isAttending 
                          ? 'shadow-md border-rose-300' 
                          : isRecommended
                          ? 'shadow-md border-sky-400'
                          : 'shadow-sm hover:shadow-md'
                      }`}
                    >
                      {isAttending && (
                        <div className="absolute top-0 right-0 bg-rose-400 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-bl-[1.5rem]">
                          Me uní
                        </div>
                      )}
                      {isRecommended && (
                        <div className="absolute top-0 right-0 bg-sky-400 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-bl-[1.5rem]">
                          Recomendado
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        {event.imageUrl && (
                          <div className="h-12 w-12 rounded-2xl shrink-0 overflow-hidden bg-white/50">
                            <img src={event.imageUrl} alt={event.title} className="h-full w-full object-cover" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-slate-900 text-base mb-1 pr-16 truncate">{event.title}</h3>
                          <p className="text-sm text-slate-700 line-clamp-2 mb-4 leading-relaxed">{event.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <div className="flex gap-2">
                          <span className="flex items-center gap-1.5 bg-white/60 px-3 py-1.5 rounded-full">
                            <Clock className="h-3.5 w-3.5 text-slate-500" /> {new Date(event.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </span>
                          <span className="flex items-center gap-1.5 bg-white/60 px-3 py-1.5 rounded-full">
                            {interestName || 'Interés'}
                          </span>
                        </div>
                        <span className="flex items-center gap-1 bg-white/60 px-3 py-1.5 rounded-full">
                          <Users className="h-3.5 w-3.5 text-slate-500" /> {event.attendees.length}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
