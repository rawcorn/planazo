import React, { useState, useEffect, useRef } from 'react'
import { useUIStore } from '@/store/uiStore'
import { Button } from '@/components/ui/button'
import { ChevronLeft, MapPin, User, AtSign, Link as LinkIcon, AlertTriangle, Clock, Users, ExternalLink, Plus, X, ArrowLeft, Moon, Camera, LogOut, MessageCircle, Settings, Eye, EyeOff, CheckCircle2, Loader2, Trash2 } from 'lucide-react'
import { DatePicker } from '@/components/ui/DatePicker'
import { IosTimePicker } from '@/components/ui/IosTimePicker'
import { useShallow } from 'zustand/react/shallow'
import { updatePassword, deleteAccount } from '@/app/actions/auth'

export function RightColumn() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { 
    currentUser, 
    users, 
    events, 
    myEvents,
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
    logout,
    updateUserProfile
  } = useUIStore(useShallow(state => ({
    currentUser: state.currentUser,
    users: state.users,
    events: state.events,
    myEvents: state.myEvents,
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
    logout: state.logout,
    updateUserProfile: state.updateUserProfile
  })))



  const defaultRegionId = regions.find(r => r.name === currentUser?.region)?.id || regions[0]?.id || '';
  
  const [newPlan, setNewPlan] = useState({ 
    title: '', description: '', region: defaultRegionId, interest: interests[0]?.id || '', 
    date: '', hour: '', minute: '', maxAttendees: '', address: '', ageMin: '', ageMax: '', genderPreference: 'Todos' as 'Todos' | 'Solo mujeres' | 'Solo hombres', imageUrl: '', imageFile: null as File | null
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formErrorField, setFormErrorField] = useState<string | null>(null);

  const [editProfileData, setEditProfileData] = useState({
    email: '',
    newPassword: '',
    instagram: '',
    interests: [] as string[],
    avatarUrl: '',
    imageFile: null as File | null
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteEventModal, setShowDeleteEventModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingEvent, setIsSavingEvent] = useState(false);

  useEffect(() => {
    if (duplicateWarning || formError) {
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({
            top: scrollContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [duplicateWarning, formError]);

  // Ensure newPlan has valid defaults if it loaded before catalogs
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!newPlan.region && defaultRegionId) setNewPlan(p => ({ ...p, region: defaultRegionId }));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!newPlan.interest && interests[0]?.id) setNewPlan(p => ({ ...p, interest: interests[0].id }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regions, interests, defaultRegionId])

  const prevActiveViewRef = useRef(activeView);
  const prevRoomIdRef = useRef(activeRoomId);

  // Reset form and set region when opening create event view
  useEffect(() => {
    if (activeView === 'create_event' && (prevActiveViewRef.current !== 'create_event' || prevRoomIdRef.current !== activeRoomId)) {
      const activeRegObj = regions.find(r => r.room_id === activeRoomId);
      const activeEv = events.find(e => e.id === activeRoomId);
      const contextRegionId = activeEv ? activeEv.region : activeRegObj?.id;
      const rId = contextRegionId || defaultRegionId;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNewPlan({ 
        title: '', description: '', region: rId, interest: interests[0]?.id || '', 
        date: '', hour: '', minute: '', maxAttendees: '', address: '', ageMin: '', ageMax: '', genderPreference: 'Todos', imageUrl: '', imageFile: null
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormError(null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormErrorField(null);
    } else if (activeView === 'edit_profile' && currentUser && prevActiveViewRef.current !== 'edit_profile') {
      setEditProfileData({
        email: '',
        newPassword: '',
        instagram: currentUser.instagram || '',
        interests: currentUser.interests || [],
        avatarUrl: currentUser.avatarUrl || '',
        imageFile: null
      });
      setFormError(null);
      setFormErrorField(null);
    } else if (activeView === 'edit_event' && selectedEventId && prevActiveViewRef.current !== 'edit_event') {
      const evToEdit = events.find(e => e.id === selectedEventId);
      if (evToEdit) {
        const d = new Date(evToEdit.date);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setNewPlan({
          title: evToEdit.title,
          description: evToEdit.description?.replace(/<!--edited.*?-->/g, ''),
          region: evToEdit.region,
          interest: evToEdit.interest,
          date: `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`,
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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormError(null);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormErrorField(null);
      }
    }
    
    prevActiveViewRef.current = activeView;
    prevRoomIdRef.current = activeRoomId;
  }, [activeView, activeRoomId, regions, events, defaultRegionId, interests, selectedEventId, currentUser]);

  if (!currentUser) return null;

  const getUser = (id: string) => {
    if (currentUser && id === currentUser.id) return currentUser;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (users.find(u => u.id === id) || { username: 'Usuario Desconocido', avatarUrl: '', interests: [], age: 0, gender: 'X', region: '', instagram: '', facebook: '' }) as unknown as any;
  }

  const activeRegionObj = regions.find(r => r.room_id === activeRoomId);
  const isRegionRoom = !!activeRegionObj;
  const isEventRoom = !isRegionRoom && events.some(e => e.id === activeRoomId);
  
  const activeEvent = isEventRoom ? events.find(e => e.id === activeRoomId) : null;
  const fallbackRegion = regions.find(r => r.name === currentUser.region);
  
  const currentRegionIdContext = activeEvent ? activeEvent.region : (activeRegionObj?.id || fallbackRegion?.id);
  const currentRegionName = activeRegionObj ? activeRegionObj.name : (activeEvent ? regions.find(r => r.id === activeEvent.region)?.name : (fallbackRegion?.name || ''));


  const regionEvents = events
    .filter(e => e.region === currentRegionIdContext)
    // eslint-disable-next-line react-hooks/purity
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

  const eventToShow = selectedEventId ? (events.find(e => e.id === selectedEventId) || myEvents.find(e => e.id === selectedEventId)) : (isEventRoom ? activeEvent : null);
  const profileToShow = selectedUserId ? getUser(selectedUserId) : null;

  const executeCreation = async () => {
    setFormError(null);
    setFormErrorField(null);
    setIsSavingEvent(true);
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

    setIsSavingEvent(false);
    
    if (res.id) {
      setDuplicateWarning(null);
      setSelectedEvent(res.id);
      setRightColumnView('event_details');
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
      if (String(ev.region) !== String(newPlan.region)) return false;
      if (String(ev.interest) !== String(newPlan.interest)) return false;
      
      const evDate = new Date(ev.date);
      const isSameDay = evDate.getFullYear() === eventDateTime.getFullYear() && 
                        evDate.getMonth() === eventDateTime.getMonth() && 
                        evDate.getDate() === eventDateTime.getDate();
      
      if (!isSameDay) return false;

      const timeDiffHours = Math.abs(evDate.getTime() - eventDateTime.getTime()) / (1000 * 60 * 60);
      
      return timeDiffHours <= 3; 
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

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
               setEditProfileData({ ...editProfileData, imageFile: newFile, avatarUrl: compressedBase64 });
            });
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);
    setFormErrorField(null);
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (editProfileData.email && !emailRegex.test(editProfileData.email)) {
       setFormError('Email inválido.');
       setFormErrorField('email');
       return;
    }

    if (editProfileData.newPassword && editProfileData.newPassword.length < 8) {
       setFormError('La contraseña debe tener al menos 8 caracteres.');
       setFormErrorField('password');
       return;
    }

    setIsSavingProfile(true);
    if (editProfileData.newPassword) {
       const pwRes = await updatePassword(editProfileData.newPassword);
       if (pwRes.error) {
         setFormError(pwRes.error);
         setIsSavingProfile(false);
         return;
       }
    }

    const res = await updateUserProfile({
       email: editProfileData.email.trim() || currentUser.email,
       instagram: editProfileData.instagram,
       interests: editProfileData.interests,
       avatarUrl: editProfileData.avatarUrl
    }, editProfileData.imageFile);
    
    setIsSavingProfile(false);
    if (res.error) {
       setFormError(res.error);
       return;
    }
    
    setFormSuccess('Cambios guardados con éxito');
    const freshUser = useUIStore.getState().currentUser;
    if (freshUser) {
      setEditProfileData({
        email: '',
        instagram: freshUser.instagram || '',
        avatarUrl: freshUser.avatarUrl || '',
        interests: freshUser.interests ? freshUser.interests.map((i:any) => i.name || i) : [],
        newPassword: '',
        imageFile: null
      });
    }
  };

  const handleCloseEditProfile = () => {
    if (hasProfileChanges) {
      setShowExitConfirm(true);
    } else {
      setRightColumnView('profile');
      setFormError(null);
      setFormSuccess(null);
    }
  };

  const confirmDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const executeDeleteAccount = async () => {
    setIsDeleting(true);
    const res = await deleteAccount();
    if (res.error) {
      setFormError(res.error);
      setIsDeleting(false);
      setShowDeleteModal(false);
    } else {
      logout();
    }
  };

  const hasProfileChanges = currentUser ? (
    (editProfileData.email !== '' && editProfileData.email !== (currentUser.email || '')) ||
    editProfileData.instagram !== (currentUser.instagram || '') ||
    editProfileData.avatarUrl !== (currentUser.avatarUrl || '') ||
    editProfileData.imageFile !== null ||
    editProfileData.newPassword !== '' ||
    JSON.stringify([...editProfileData.interests].sort()) !== JSON.stringify([...(currentUser.interests || []).map((i: any) => i.name || i)].sort())
  ) : false;

  return (
    <div className="flex flex-col h-full w-full bg-slate-100 text-slate-900 relative">
      {/* MODAL SALIR SIN GUARDAR */}
      {showExitConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <h3 className="text-lg font-bold text-slate-900 mb-2">¿Salir sin guardar?</h3>
              <p className="text-sm text-slate-500">
                Tenés cambios sin guardar. ¿Estás seguro de que querés salir?
              </p>
            </div>
            <div className="flex border-t border-slate-100">
              <button 
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 px-4 py-4 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Quedarme
              </button>
              <button 
                onClick={() => {
                  setShowExitConfirm(false);
                  resetRightColumn();
                }}
                className="flex-1 px-4 py-4 text-sm font-bold text-rose-500 hover:bg-rose-50 transition-colors border-l border-slate-100"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR EVENTO */}
      {showDeleteEventModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-6 w-6 text-rose-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">¿Eliminar planazo?</h3>
              <p className="text-sm text-slate-500">
                Esta acción no se puede deshacer. Se borrará el planazo y todos sus mensajes.
              </p>
            </div>
            <div className="flex border-t border-slate-100">
              <button 
                onClick={() => setShowDeleteEventModal(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-4 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={async () => {
                  if (!eventToShow) return;
                  setIsDeleting(true);
                  await deleteEvent(eventToShow.id);
                  setShowDeleteEventModal(false);
                  setIsDeleting(false);
                  resetRightColumn();
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-4 text-sm font-bold text-rose-500 hover:bg-rose-50 transition-colors border-l border-slate-100"
              >
                {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR CUENTA */}
      {showDeleteModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-6 w-6 text-rose-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">¿Eliminar tu cuenta?</h3>
              <p className="text-sm text-slate-500">
                Esta acción no se puede deshacer. Todos tus datos, planes y mensajes se borrarán permanentemente.
              </p>
            </div>
            <div className="flex border-t border-slate-100">
              <button 
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-4 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={executeDeleteAccount}
                disabled={isDeleting}
                className="flex-1 px-4 py-4 text-sm font-bold text-rose-500 hover:bg-rose-50 transition-colors border-l border-slate-100"
              >
                {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="h-16 px-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {activeView === 'create_event' ? (
            <button onClick={() => {
    const rId = activeRoomId || defaultRegionId;
    setNewPlan({ 
      title: '', description: '', region: rId, interest: interests[0]?.id || '', 
      date: '', hour: '', minute: '', maxAttendees: '', address: '', ageMin: '', ageMax: '', genderPreference: 'Todos', imageUrl: '', imageFile: null
    });
    setFormError(null);
    setFormErrorField(null);
    resetRightColumn();
  }} className="p-1.5 -ml-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">
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
          <h2 className="font-bold text-lg text-[#3f3f46] flex items-center gap-2">
            {activeView === 'profile' ? 'Perfil de Usuario' : 
             activeView === 'edit_profile' ? 'Editar Perfil' : 
             activeView === 'create_event' ? 'Armar un Planazo' : 
             activeView === 'event_details' ? 'Detalles del Planazo' : 
             `Planazos en ${currentRegionName}`}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {(activeView === 'create_event' || activeView === 'edit_event' || activeView === 'event_details' || activeView === 'profile' || activeView === 'edit_profile') && (
            <button onClick={() => {
    if (activeView === 'edit_profile') {
      handleCloseEditProfile();
      return;
    }
    if (activeView === 'create_event') {
      const rId = activeRoomId || defaultRegionId;
      setNewPlan({ 
        title: '', description: '', region: rId, interest: interests[0]?.id || '', 
        date: '', hour: '', minute: '', maxAttendees: '', address: '', ageMin: '', ageMax: '', genderPreference: 'Todos', imageUrl: '', imageFile: null
      });
      setFormError(null);
      setFormErrorField(null);
    }
    resetRightColumn();
  }} className={`p-1.5 rounded-lg transition-colors ${(activeView === 'create_event' || activeView === 'edit_event' || activeView === 'edit_profile') ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'} ${activeView === 'profile' ? 'hidden lg:flex' : ''}`}>
    <X className="h-5 w-5" />
  </button>
          )}
        </div>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6 bg-slate-100">
        
        {/* PERFIL */}
        {activeView === 'profile' && profileToShow && (
          <div className="space-y-6">
            <div className="text-center pt-2 relative">
              {currentUser.id === profileToShow.id && (
                <button 
                  onClick={() => setRightColumnView('edit_profile')} 
                  className="absolute top-0 right-0 p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-200 rounded-full transition-colors shadow-sm border border-slate-100"
                  title="Configuración de la cuenta"
                >
                  <Settings className="h-5 w-5" />
                </button>
              )}
              {profileToShow.avatarUrl ? (
                <img src={profileToShow.avatarUrl} alt={profileToShow.username} className="h-32 w-32 rounded-full mx-auto mb-5 object-cover border-4 border-slate-50 shadow-sm" />
              ) : (
                <div className="h-32 w-32 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-5xl font-black mx-auto mb-5 border-4 border-slate-50 shadow-sm">
                  {profileToShow.username.charAt(0).toUpperCase()}
                </div>
              )}
              <h3 className="text-2xl font-black text-[#3f3f46] mb-1 tracking-tight">{profileToShow.username}</h3>
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
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Redes Sociales</h4>
                {profileToShow.instagram && (
                  <a href={`https://instagram.com/${profileToShow.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-600 hover:text-pink-600 transition-colors font-bold text-sm">
                    <svg className="h-4 w-4 text-pink-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                    </svg>
                    @{profileToShow.instagram.replace('@', '')}
                  </a>
                )}
                {profileToShow.facebook && (
                  <a href={profileToShow.facebook.includes('http') ? profileToShow.facebook : `https://facebook.com/${profileToShow.facebook}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors font-bold text-sm">
                    <LinkIcon className="h-4 w-4 text-blue-500" /> Perfil de Facebook
                  </a>
                )}
              </div>
            )}

            {currentUser.id !== profileToShow.id && (
              <div className="pt-6 flex justify-center">
                <button 
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-100 hover:bg-violet-100 text-slate-600 hover:text-violet-700 font-semibold rounded-full border border-slate-200 hover:border-violet-300 transition-colors shadow-sm" 
                  onClick={() => startDirectMessage(profileToShow.id)}
                >
                  <MessageCircle className="h-4 w-4" />
                  Mensaje
                </button>
              </div>
            )}
          </div>
        )}

        {/* EDITAR PERFIL */}
        {activeView === 'edit_profile' && (
          <div className="relative">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex justify-center mb-6 relative w-24 mx-auto">
                <label className="relative cursor-pointer group block">
                  <div className="h-24 w-24 rounded-full bg-blue-50 border-2 border-dashed border-blue-200 flex flex-col items-center justify-center text-sky-500 group-hover:bg-blue-100 group-hover:border-blue-300 transition-colors overflow-hidden">
                    {editProfileData.avatarUrl ? (
                      <img src={editProfileData.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <>
                        <Camera className="h-6 w-6 mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider flex flex-col items-center">Foto</span>
                      </>
                    )}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload} />
                </label>
                {editProfileData.avatarUrl && (
                  <button type="button" onClick={() => setEditProfileData({ ...editProfileData, avatarUrl: '', imageFile: null })} className="absolute top-0 right-0 bg-white/80 text-slate-500 rounded-full p-1.5 hover:bg-white hover:text-rose-500 shadow-sm backdrop-blur-sm transition-all z-10">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {formError && (
                <div className="bg-rose-50 text-rose-500 text-xs font-medium rounded-lg p-2.5 flex items-center justify-center gap-2 mb-2 animate-in fade-in duration-200">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="bg-emerald-50 text-emerald-600 text-xs font-medium rounded-lg p-2.5 flex items-center justify-center gap-2 mb-2 animate-in fade-in duration-200">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Email <span className="text-slate-400 font-normal lowercase">(solo para iniciar sesión)</span></label>
                <input 
                  type="email"
                  className={`w-full bg-slate-100 border rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400 ${formErrorField === 'email' ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200'}`} 
                  placeholder="tu@email.com"
                  value={editProfileData.email} 
                  onChange={e => { setEditProfileData({...editProfileData, email: e.target.value}); if (formErrorField === 'email') { setFormError(null); setFormErrorField(null); } }} 
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Nueva Contraseña</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    className={`w-full bg-slate-100 border rounded-xl pl-4 pr-10 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400 ${formErrorField === 'password' ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200'}`} 
                    placeholder="••••••••"
                    value={editProfileData.newPassword} 
                    onChange={e => { setEditProfileData({...editProfileData, newPassword: e.target.value}); if (formErrorField === 'password') { setFormError(null); setFormErrorField(null); } }} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Instagram <span className="text-slate-400 font-normal lowercase">(Opcional)</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <AtSign className="h-4 w-4 text-slate-400" />
                  </div>
                  <input 
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400" 
                    placeholder="usuario" 
                    value={editProfileData.instagram} 
                    onChange={e => setEditProfileData({...editProfileData, instagram: e.target.value})} 
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Tus Intereses</label>
                <div className="flex flex-wrap gap-2">
                  {interests.map(i => {
                    const isSelected = editProfileData.interests.includes(i.name);
                    return (
                      <button
                        key={i.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setEditProfileData({ ...editProfileData, interests: editProfileData.interests.filter(name => name !== i.name) });
                          } else {
                            setEditProfileData({ ...editProfileData, interests: [...editProfileData.interests, i.name] });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors border ${
                          isSelected 
                            ? 'bg-blue-100 border-blue-300 text-blue-700' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {i.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="pt-6 pb-2 flex flex-col items-center gap-4">
                <button type="button" onClick={logout} className="text-sm font-bold text-slate-500 hover:text-slate-700 underline-offset-4 hover:underline transition-all">
                  Cerrar Sesión
                </button>
                <button type="button" onClick={confirmDeleteAccount} className="text-sm font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-4 py-2 rounded-full transition-all">
                  Eliminar cuenta
                </button>
              </div>
            </form>
          </div>
        )}

        {/* CREAR / EDITAR EVENTO */}
        {(activeView === 'create_event' || activeView === 'edit_event') && (
          <div className="relative">
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
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Día</label>
                  <DatePicker 
                    value={newPlan.date} 
                    onChange={(d) => {
    const todayObj = new Date();
    const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
    const isToday = d === todayStr;
    const isFuture = d && d !== todayStr;
    const currentHStr = String(todayObj.getHours()).padStart(2, '0');
    const currentMStr = String(todayObj.getMinutes()).padStart(2, '0');
    
    // Always reset hour/minute when picking a date
    const h = isToday ? currentHStr : (isFuture ? '00' : '');
    const m = isToday ? currentMStr : (isFuture ? '00' : '');
    
    setNewPlan({...newPlan, date: d, hour: h, minute: m}); 
    if (formErrorField === 'date' || formErrorField === 'time') { setFormError(null); setFormErrorField(null); }
  }} 
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
                <Button type="submit" className="w-full py-3.5 bg-[#9fbdd0] hover:bg-[#86aec6] text-white shadow-sm font-bold transition-all flex items-center justify-center gap-2" disabled={duplicateWarning !== null || isSavingEvent}>
                  {isSavingEvent && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSavingEvent ? 'Guardando...' : (activeView === 'edit_event' ? 'Guardar Cambios' : 'Crear Planazo')}
                </Button>
                {formError && (
                  <div className="text-slate-500 text-xs flex items-center gap-1.5 pt-1 animate-in fade-in duration-200">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                    <span>{formError}</span>
                  </div>
                )}
              </div>
            </form>

            {duplicateWarning && (
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-rose-700">¡Plan similar creado!</p>
                    <p className="text-xs text-rose-600 mt-1 mb-4">Ya existe &quot;{duplicateWarning.title}&quot; cerca de ese horario o lugar. ¿Quieres proponer el tuyo de todos modos?</p>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" className="flex-1 py-2 text-xs" onClick={() => setDuplicateWarning(null)}>Editar</Button>
                      <Button type="button" variant="danger" className="flex-1 py-2 text-xs bg-rose-500 hover:bg-rose-600 text-white" onClick={executeCreation}>Publicar igual</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DETALLES DE EVENTO */}
        {activeView === 'event_details' && eventToShow && (
          <div className="space-y-6">
            <div className="flex items-center justify-between -mt-2 mb-2">
              {eventToShow.creatorId === currentUser.id ? (
                <>
                  <button onClick={() => setRightColumnView('edit_event')} className="text-[13px] text-slate-500 hover:text-slate-800 font-medium underline underline-offset-4 decoration-slate-300 hover:decoration-slate-800 transition-colors">
                    Editar
                  </button>
                  <button onClick={() => setShowDeleteEventModal(true)} className="text-xs text-rose-600 bg-rose-100 hover:bg-rose-200 px-3 py-1.5 rounded-lg transition-colors">
                    Eliminar
                  </button>
                </>
              ) : (
                <div></div>
              )}
            </div>
            
            <div className="text-center">
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
              <h3 className="text-lg font-bold text-slate-900 mb-2 tracking-tight leading-snug flex items-center justify-center gap-2">
                {eventToShow.title}
                {eventToShow.description?.match(/<!--edited.*?-->/) && (() => { const match = eventToShow.description.match(/<!--edited:(.*?)-->/); const edits = match ? match[1] : ''; return <span className="bg-slate-200 text-slate-500 text-[10px] px-2 py-0.5 rounded-md uppercase font-bold border border-slate-300">{edits && edits !== 'algo' ? `Editado: ${edits}` : 'Editado'}</span>; })()}
              </h3>
              <span className="inline-block bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                {interests.find(i => i.id === eventToShow.interest)?.name || 'Interés'}
              </span>
            </div>

            {eventToShow.attendees.includes(currentUser.id) ? (
              <div className="flex flex-col items-center gap-1.5 pt-2">
                <div className="flex items-center gap-2 text-sm text-emerald-600 font-bold bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100">
                  <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Ya estás adentro
                </div>
                {true && (
                  <button onClick={() => leaveEvent(eventToShow.id)} className="text-[11px] text-slate-400 hover:text-rose-500 underline underline-offset-2 transition-colors mt-1 font-medium">
                    Bajarme del Planazo
                  </button>
                )}
              </div>
            ) : (
              <Button className="w-full py-3.5 shadow-sm text-white" onClick={() => { joinEvent(eventToShow.id); resetRightColumn(); }}>
                Sumarme al Planazo
              </Button>
            )}

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-6">
              {eventToShow.description && eventToShow.description.replace(/<!--edited.*?-->/g, '').trim() !== '' && (
                <p className="text-slate-700 text-sm leading-relaxed">
                  &quot;{eventToShow.description.replace(/<!--edited.*?-->/g, '')}&quot;
                </p>
              )}
              
              <div className={`space-y-4 ${eventToShow.description && eventToShow.description.replace(/<!--edited.*?-->/g, '').trim() !== '' ? 'pt-5 border-t border-slate-200' : ''}`}>
                <div className="flex items-start gap-4 text-sm">
                  <div className="p-2 bg-slate-100 rounded-lg border border-slate-200 text-sky-500 shrink-0">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Cuándo</p>
                    <p className="text-slate-900 font-medium">{new Date(eventToShow.date).toLocaleDateString('es-AR', { weekday: 'long' })} {new Date(eventToShow.date).getDate()}/{new Date(eventToShow.date).getMonth() + 1} a las {new Date(eventToShow.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
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
                        <p className="text-sm font-bold text-slate-900 truncate">{u.username}</p>
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
        )}

        {/* CARTELERA */}
        {activeView === 'cartelera' && (
          <div className="space-y-6">
            <Button className="w-full py-3.5 shadow-sm text-white" onClick={() => {
    const rId = activeRoomId || defaultRegionId;
    setNewPlan({ 
      title: '', description: '', region: rId, interest: interests[0]?.id || '', 
      date: '', hour: '', minute: '', maxAttendees: '', address: '', ageMin: '', ageMax: '', genderPreference: 'Todos', imageUrl: '', imageFile: null
    });
    setFormError(null);
    setFormErrorField(null);
    setRightColumnView('create_event');
  }}>
              <Plus className="h-5 w-5" /> Armar un Planazo
            </Button>
            
            {regionEvents.length === 0 ? (
              <div className="text-center py-16 text-slate-600">
                <div className="bg-sky-100 border border-sky-200 h-20 w-20 rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-sm text-4xl">
                  🏖️
                </div>
                <p className="font-bold text-[#3f3f46] text-lg">No hay Planazos próximos en esta zona.</p>
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
                        event.creatorId === currentUser.id
                          ? 'shadow-md border-blue-300'
                          : isAttending 
                          ? 'shadow-md border-emerald-300' 
                          : isRecommended
                          ? 'shadow-md border-sky-400'
                          : 'shadow-sm hover:shadow-md'
                      }`}
                    >
                      {event.creatorId === currentUser.id ? (
                        <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-bl-[1.5rem] z-10 shadow-sm">
                          Creador
                        </div>
                      ) : isAttending ? (
                        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-bl-[1.5rem] z-10 shadow-sm">
                          Me uní
                        </div>
                      ) : isRecommended ? (
                        <div className="absolute top-0 right-0 bg-sky-400 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-bl-[1.5rem] z-10 shadow-sm">
                          Recomendado
                        </div>
                      ) : null}
                      <div className="flex items-start gap-3">
                        {event.imageUrl && (
                          <div className="h-12 w-12 rounded-2xl shrink-0 overflow-hidden bg-white/50">
                            <img src={event.imageUrl} alt={event.title} className="h-full w-full object-cover" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-slate-900 text-base mb-1 pr-16 truncate flex items-center gap-2">
                            <span className="truncate">{event.title}</span>
                            {event.description?.match(/<!--edited.*?-->/) && (() => { const match = event.description.match(/<!--edited:(.*?)-->/); const edits = match ? match[1] : ''; return <span className="bg-slate-200/70 text-slate-500 text-[9px] px-1.5 py-0.5 rounded-md uppercase font-bold border border-slate-300 shrink-0">{edits && edits !== 'algo' ? `Editado: ${edits}` : 'Editado'}</span>; })()}
                          </h3>
                          <p className="text-sm text-slate-700 line-clamp-2 mb-4 leading-relaxed">{event.description?.replace(/<!--edited.*?-->/g, '')}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <div className="flex gap-2">
                          <span className="flex items-center gap-1.5 bg-white/60 px-3 py-1.5 rounded-full">
                            <Clock className="h-3.5 w-3.5 text-slate-500" /> {new Date(event.date).toLocaleDateString('es-AR', { weekday: 'long' })} {new Date(event.date).getDate()}/{new Date(event.date).getMonth() + 1} • {new Date(event.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}
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
      
      {/* STICKY FOOTER EDIT PROFILE */}
      {activeView === 'edit_profile' && (
        <div className="p-4 bg-white border-t border-slate-200 shrink-0 flex items-center justify-between">
          <button 
            type="button" 
            onClick={handleCloseEditProfile} 
            className="text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="button"
            disabled={!hasProfileChanges || isSavingProfile}
            onClick={() => handleSaveProfile()} 
            className={`text-sm font-bold px-6 py-2.5 rounded-full text-white transition-all flex items-center gap-2 ${
              (hasProfileChanges && !isSavingProfile) 
                ? 'bg-[#75D1A4] shadow-sm transform hover:-translate-y-0.5' 
                : 'bg-[#86E2B5] cursor-not-allowed shadow-none'
            }`}
          >
            {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSavingProfile ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      )}
    </div>
  )
}






