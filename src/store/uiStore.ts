/* eslint-disable */
import { create } from 'zustand'
import { createEvent, updateEvent, deleteEvent as deleteEventAction, joinEvent, leaveEvent, getEventsByRegion } from '@/app/actions/events'
import { sendMessage as sendMessageAPI, getRoomMessages, getOrCreateDMRoom } from '@/app/actions/messages'
import { getRegions, getInterests } from '@/app/actions/catalog'
import { uploadImage } from '@/app/actions/storage'
import { signOut } from '@/app/actions/auth'
import { createClient as createBrowserClient } from '@/lib/supabase/client'

export interface Region {
  id: string
  name: string
  room_id: string
}

export interface Interest {
  id: string
  name: string
}

export interface User {
  id: string
  username: string
  email: string
  password?: string
  age: number
  gender: string
  region: string // This is the string name from users table
  interests: string[] // List of interest names
  avatarUrl: string
  instagram?: string
  facebook?: string
}

export interface Event {
  id: string
  title: string
  description: string
  creatorId: string
  region: string // UUID of the region
  interest: string // UUID of the interest
  date: string
  attendees: string[]
  maxAttendees: number | null
  address: string
  ageMin: number | null
  ageMax: number | null
  genderPreference: 'Todos' | 'Solo mujeres' | 'Solo hombres'
  imageUrl?: string
  imageFile?: File | null
}

export interface Message {
  id: string
  roomId: string
  senderId?: string
  text: string
  timestamp: string
  type: 'text' | 'system'
  eventId?: string
  parentId?: string
  isDeleted?: boolean
  deletedBy?: string[]
}

export type MobileView = 'menu' | 'chat' | 'details'
export type RightColumnView = 'cartelera' | 'create_event' | 'event_details' | 'profile' | 'edit_event'

interface AppState {
  currentUser: User | null
  users: User[]
  events: Event[]
  myEvents: Event[]
  messages: Record<string, Message[]>
  dmChannels: any[]
  
  regions: Region[]
  interests: Interest[]

  activeRoomId: string // UUID of the room (Region room, Event room, or DM room)
  activeThreadId: string | null
  activeView: RightColumnView
  mobileView: MobileView
  selectedEventId: string | null
  selectedUserId: string | null
  duplicateWarning: Event | null

  // Auth actions
  login: (user: User) => void
  logout: () => void
  
  // Navigation actions
  setActiveRoom: (roomId: string) => void
  setActiveThreadId: (threadId: string | null) => void
  setRightColumnView: (view: RightColumnView) => void
  setMobileView: (view: MobileView) => void
  setSelectedEvent: (eventId: string | null) => void
  setSelectedUser: (userId: string | null) => void
  setDuplicateWarning: (event: Event | null) => void
  resetRightColumn: () => void

  // Data fetching actions
  setEvents: (events: Event[]) => void
  setMessages: (roomId: string, messages: Message[]) => void
  loadCatalogs: () => Promise<void>
  setDmChannels: (channels: any[]) => void

  // Domain actions
  createEvent: (eventData: Omit<Event, 'id' | 'creatorId' | 'attendees'>) => Promise<{ id?: string, error?: string }>
  updateEvent: (eventId: string, eventData: Partial<Event>) => Promise<{ id?: string, error?: string }>
  deleteEvent: (eventId: string) => Promise<{ success?: boolean, error?: string }>
  joinEvent: (eventId: string) => Promise<void>
  leaveEvent: (eventId: string) => Promise<void>
  sendMessage: (roomId: string, text: string, parentId?: string) => Promise<void>
  activeSubscription: any
  subscribeToRoom: (roomId: string) => void
  unsubscribeFromRoom: () => void

  startDirectMessage: (targetUserId: string) => Promise<void>
  fetchEventsForRegion: (regionId: string) => Promise<void>
  fetchMyEvents: () => Promise<void>
  fetchMessagesForRoom: (roomId: string) => Promise<void>
  deleteMessageForMe: (messageId: string, roomId: string) => Promise<void>
  deleteMessageForEveryone: (messageId: string, roomId: string) => Promise<void>
}

export const useUIStore = create<AppState>((set, get) => ({
  currentUser: null,
  users: [],
  events: [],
  myEvents: [],
  messages: {},
  dmChannels: [],
  
  regions: [],
  interests: [],

  activeRoomId: '',
  activeThreadId: null,
  activeView: 'cartelera',
  mobileView: 'chat',
  selectedEventId: null,
  selectedUserId: null,
  duplicateWarning: null,

  login: (user) => set({ currentUser: user }),
  logout: async () => {
    await signOut();
    set({ currentUser: null });
  },
  
  setActiveRoom: (roomId) => set({ activeRoomId: roomId, activeThreadId: null, activeView: 'cartelera', selectedEventId: null, selectedUserId: null }),
  setActiveThreadId: (threadId) => set({ activeThreadId: threadId, mobileView: 'chat' }),
  setRightColumnView: (view) => set({ activeView: view }),
  setMobileView: (view) => set({ mobileView: view }),
  setDmChannels: (channels) => set({ dmChannels: channels }),
  setSelectedEvent: (eventId) => set({ selectedEventId: eventId, activeView: eventId ? 'event_details' : 'cartelera' }),
  setSelectedUser: (userId) => set({ selectedUserId: userId, activeView: userId ? 'profile' : 'cartelera' }),
  setDuplicateWarning: (event) => set({ duplicateWarning: event }),
  resetRightColumn: () => {
    const { activeRoomId, events, myEvents, currentUser, regions } = get();
    let targetRoom = activeRoomId;
    
    // Check if active room is a region room
    const isRegionRoom = regions.some(r => r.room_id === activeRoomId);
    
    if (!isRegionRoom) {
       const userRegion = regions.find(r => r.name === currentUser?.region);
       targetRoom = userRegion?.room_id || regions[0]?.room_id || '';
    }
    set({ 
      activeView: 'cartelera', 
      selectedEventId: null, 
      selectedUserId: null, 
      activeRoomId: targetRoom,
      mobileView: 'chat',
      duplicateWarning: null
    });
  },

  setEvents: (events) => set({ events }),
  setMessages: (roomId, msgs) => set(state => ({
    messages: { ...state.messages, [roomId]: msgs }
  })),

  loadCatalogs: async () => {
    try {
      const [regRes, intRes] = await Promise.all([getRegions(), getInterests()]);
      if (regRes.regions) set({ regions: regRes.regions as Region[] });
      if (intRes.interests) {
        const interests = [...intRes.interests] as Interest[];
        set({ interests });
      }
    } catch (e) {
      console.error('Failed to load catalogs', e);
    }
  },

  createEvent: async (eventData) => {
    const { currentUser, fetchEventsForRegion } = get();
    if (!currentUser) return { error: 'Not authenticated' };
    
    let finalImageUrl = undefined;
    if (eventData.imageFile) {
      const formData = new FormData();
      formData.append('file', eventData.imageFile);
      formData.append('bucket', 'event_images');
      const publicUrl = await uploadImage(formData);
      if (publicUrl) {
        finalImageUrl = publicUrl;
      }
    }

    const res = await createEvent({
      title: eventData.title,
      description: eventData.description,
      region_id: eventData.region, 
      category_id: eventData.interest, 
      event_datetime: eventData.date,
      address: eventData.address,
      max_attendees: eventData.maxAttendees || undefined,
      min_age: eventData.ageMin || undefined,
      max_age: eventData.ageMax || undefined,
      image_url: finalImageUrl,
    });

    if (res.error) {
       return { error: res.error };
    }

    if (res.event) {
       await fetchEventsForRegion(eventData.region);
       await get().fetchMyEvents();
       return { id: res.event.id };
    }
    return { error: 'Error desconocido' };
  },

  updateEvent: async (eventId, eventData) => {
    const { currentUser, fetchEventsForRegion, events } = get();
    if (!currentUser) return { error: 'Not authenticated' };

    const ev = events.find(e => e.id === eventId);
    if (!ev) return { error: 'Evento no encontrado' };
    
    let finalImageUrl = eventData.imageUrl;
    if (eventData.imageFile) {
      const formData = new FormData();
      formData.append('file', eventData.imageFile);
      formData.append('bucket', 'event_images');
      const publicUrl = await uploadImage(formData);
      if (publicUrl) {
        finalImageUrl = publicUrl;
      }
    }

    const changedFields: string[] = [];
    if (eventData.title && eventData.title !== ev.title) changedFields.push('el título');
    let rawDesc = eventData.description !== undefined ? eventData.description : ev.description;
    if (eventData.description !== undefined && eventData.description.replace('<!--edited-->', '') !== ev.description.replace('<!--edited-->', '')) changedFields.push('la descripción');
    if (eventData.region && eventData.region !== ev.region) changedFields.push('la zona');
    if (eventData.interest && eventData.interest !== ev.interest) changedFields.push('la categoría');
    if (eventData.date && eventData.date !== ev.date) {
      const newD = new Date(eventData.date);
      const oldD = new Date(ev.date);
      const sameDay = newD.getFullYear() === oldD.getFullYear() && newD.getMonth() === oldD.getMonth() && newD.getDate() === oldD.getDate();
      const sameTime = newD.getHours() === oldD.getHours() && newD.getMinutes() === oldD.getMinutes();
      if (!sameDay && !sameTime) changedFields.push('el día y la hora');
      else if (!sameDay) changedFields.push('el día');
      else if (!sameTime) changedFields.push('la hora');
    }
    if (eventData.address !== undefined && eventData.address !== ev.address) changedFields.push('la dirección');
    if (eventData.maxAttendees !== undefined && eventData.maxAttendees !== ev.maxAttendees) changedFields.push('el cupo');
    if (eventData.ageMin !== undefined && eventData.ageMin !== ev.ageMin) changedFields.push('la edad mínima');
    if (eventData.ageMax !== undefined && eventData.ageMax !== ev.ageMax) changedFields.push('la edad máxima');
    if (eventData.imageFile || (finalImageUrl === '' && ev.imageUrl)) changedFields.push('la foto');

    if (!rawDesc.includes('<!--edited-->')) rawDesc += '<!--edited-->';

    const res = await updateEvent(eventId, {
      title: eventData.title || ev.title,
      description: rawDesc,
      region_id: eventData.region || ev.region, 
      category_id: eventData.interest || ev.interest, 
      event_datetime: eventData.date || ev.date,
      address: eventData.address !== undefined ? eventData.address : ev.address,
      max_attendees: eventData.maxAttendees !== undefined ? eventData.maxAttendees : ev.maxAttendees,
      min_age: eventData.ageMin !== undefined ? eventData.ageMin : ev.ageMin,
      max_age: eventData.ageMax !== undefined ? eventData.ageMax : ev.ageMax,
      image_url: finalImageUrl === '' ? null : finalImageUrl,
    });

    if (res.error) return { error: res.error };

    if (res.event) {
       const regionObj = get().regions.find(r => r.id === res.event.region_id);
       if (regionObj && changedFields.length > 0) {
         let changesStr = changedFields.join(', ');
         if (changedFields.length > 1) {
           const lastComma = changesStr.lastIndexOf(', ');
           changesStr = changesStr.substring(0, lastComma) + ' y ' + changesStr.substring(lastComma + 2);
         }
         await get().sendMessage(regionObj.room_id, `✏️ @${currentUser.username} editó el planazo "${res.event.title}". Modificó: ${changesStr}.`);
       }
       await fetchEventsForRegion(res.event.region_id);
       await get().fetchMyEvents();
       return { id: res.event.id };
    }
    return { error: 'Error desconocido' };
  },

  deleteEvent: async (eventId) => {
    const { fetchEventsForRegion, events, fetchMyEvents } = get();
    const ev = events.find(e => e.id === eventId);
    
    const res = await deleteEventAction(eventId);
    if (res.error) return { error: res.error };
    
    if (ev) {
       await fetchEventsForRegion(ev.region);
    }
    await fetchMyEvents();
    return { success: true };
  },

  joinEvent: async (eventId) => {
    const { fetchEventsForRegion, fetchMyEvents, events } = get();
    await joinEvent(eventId);
    const ev = events.find(e => e.id === eventId);
    if(ev) await fetchEventsForRegion(ev.region);
    await fetchMyEvents();
  },

  leaveEvent: async (eventId) => {
    const { fetchEventsForRegion, fetchMyEvents, events } = get();
    await leaveEvent(eventId);
    const ev = events.find(e => e.id === eventId);
    if(ev) await fetchEventsForRegion(ev.region);
    await fetchMyEvents();
  },

  // ¡ESTA ES LA FUNCIÓN CORREGIDA!
  sendMessage: async (roomId, text, parentId) => {
    // 1. Llama a la acción real del backend (importada arriba de todo)
    const result = await sendMessageAPI(roomId, text, parentId);
    console.log("SEND MESSAGE RESULT:", result);
    
    // 2. Refresca la lista de mensajes de la base de datos
    const { fetchMessagesForRoom } = get();
    await fetchMessagesForRoom(roomId);
  },

  fetchEventsForRegion: async (regionId: string) => {
    const supabase = createBrowserClient();
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        creator:users!events_creator_id_fkey(username, avatar_url, instagram, facebook),
        event_attendees(user_id, users!event_attendees_user_id_fkey(username, avatar_url, age, gender, instagram, facebook))
      `)
      .eq('region_id', regionId)
      .order('event_datetime', { ascending: true })
      .range(0, 49);

    if (error) {
      console.error(error);
      return;
    }
    const res = { events: data };

    if (res.events) {
       const newUsers: User[] = [];
       const mapped: Event[] = res.events.map((e: any) => {
          if (e.creator) {
              newUsers.push({
               id: e.creator_id,
               username: e.creator.username,
               avatarUrl: e.creator.avatar_url,
               email: '', age: 0, gender: 'X', region: '', interests: [],
               instagram: e.creator.instagram, facebook: e.creator.facebook
             });
          }
          if (e.event_attendees && Array.isArray(e.event_attendees)) {
             e.event_attendees.forEach((ea: any) => {
               if (ea.users) {
                 newUsers.push({
                   id: ea.user_id,
                   username: ea.users.username,
                   avatarUrl: ea.users.avatar_url,
                   age: ea.users.age || 0,
                   gender: ea.users.gender || 'X',
                   email: '', region: '', interests: [],
                   instagram: ea.users.instagram, facebook: ea.users.facebook
                 });
               }
             });
          }
          return {
             id: e.id,
             title: e.title,
             description: e.description,
             creatorId: e.creator_id,
             region: e.region_id,
             interest: e.category_id,
             date: e.event_datetime,
             attendees: e.event_attendees ? e.event_attendees.map((ea: any) => ea.user_id) : [],
             maxAttendees: e.max_attendees,
             address: e.address || '',
             ageMin: e.min_age,
             ageMax: e.max_age,
             genderPreference: 'Todos',
             imageUrl: e.image_url,
          }
       });
       
       set(state => {
         const mergedUsers = [...state.users];
         newUsers.forEach(nu => {
           const existingIdx = mergedUsers.findIndex(u => u.id === nu.id);
           if (existingIdx === -1) {
             mergedUsers.push(nu);
           } else {
             if (nu.age) mergedUsers[existingIdx] = { ...mergedUsers[existingIdx], ...nu, email: mergedUsers[existingIdx].email };
           }
         });
         return { events: mapped, users: mergedUsers };
       });
    }
  },

  fetchMyEvents: async () => {
    const { getMyEvents: getMyEventsAction } = await import('@/app/actions/events');
    const res = await getMyEventsAction();
    if (res.events) {
       const mapped: Event[] = res.events.map((e: any) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          creatorId: e.creator_id,
          region: e.region_id,
          interest: e.category_id,
          date: e.event_datetime,
          attendees: e.event_attendees ? e.event_attendees.map((ea: any) => ea.user_id) : [],
          maxAttendees: e.max_attendees,
          address: e.address || '',
          ageMin: e.min_age,
          ageMax: e.max_age,
          genderPreference: 'Todos',
          imageUrl: e.image_url,
       }));
       set({ myEvents: mapped });
    }
  },

  fetchMessagesForRoom: async (roomId: string) => {
    // Usar el cliente directamente para evitar el caché agresivo del App Router de Next.js
    const supabase = createBrowserClient();
    
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users(username, avatar_url, region, instagram, facebook),
        event:events(title, description)
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .range(0, 49);

    if (error) {
      console.error("Error al cargar mensajes:", error);
      return;
    }

    const messagesArray = data ? data.reverse() : [];

    if (messagesArray) {
        const newUsers: User[] = [];
        const mapped: Message[] = messagesArray.map((m: any) => {
           const rawSender = m.sender || m.users;
           if (m.sender_id && rawSender) {
              const senderObj = Array.isArray(rawSender) ? rawSender[0] : rawSender;
               newUsers.push({
                 id: m.sender_id,
                 username: senderObj?.username || 'Usuario Desconocido',
                 avatarUrl: senderObj?.avatar_url || '',
                 email: '', age: 0, gender: 'X', region: senderObj?.region || '', interests: [],
                 instagram: senderObj?.instagram, facebook: senderObj?.facebook
              });
           }
           return {
             id: m.id,
             roomId: roomId,
             parentId: m.parent_id || null, // ¡Esto ya lo tenías bien configurado!
             text: m.text,
             senderId: m.sender_id,
             timestamp: m.created_at,
             type: m.type === 'system_event_created' ? 'system' : 'text',
             eventId: m.event_reference_id,
             isDeleted: m.is_deleted,
             deletedBy: m.deleted_by || []
           };
        });
        
       set(state => {
         const mergedUsers = [...state.users];
         newUsers.forEach(nu => {
           const existingIdx = mergedUsers.findIndex(u => u.id === nu.id);
           if (existingIdx === -1) {
             mergedUsers.push(nu);
           }
         });
         return { 
           messages: { ...state.messages, [roomId]: mapped },
           users: mergedUsers
         };
       });
    }
  },

  activeSubscription: null as any,
  subscribeToRoom: (roomId: string) => {
    const supabase = createBrowserClient();
    const { activeSubscription, fetchMessagesForRoom } = get();
    if (activeSubscription) {
      supabase.removeChannel(activeSubscription);
    }
    const channel = supabase.channel(`room_${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` }, (payload: any) => {
         fetchMessagesForRoom(roomId);
      })
      .subscribe();
    set({ activeSubscription: channel });
  },
  unsubscribeFromRoom: () => {
    const { activeSubscription } = get();
    if (activeSubscription) {
      createBrowserClient().removeChannel(activeSubscription);
      set({ activeSubscription: null });
    }
  },

  startDirectMessage: async (targetUserId) => {
    const { currentUser, fetchMessagesForRoom } = get();
    if (!currentUser) return;
    
    const res = await getOrCreateDMRoom(targetUserId);
    if (res.roomId) {
      await fetchMessagesForRoom(res.roomId);
      
      const currentDmChannels = get().dmChannels;
      if (!currentDmChannels.some((ch: any) => ch.rooms?.id === res.roomId)) {
        set({
          dmChannels: [...currentDmChannels, { rooms: { id: res.roomId }, other_user_id: targetUserId }]
        });
      }

      set({
        activeRoomId: res.roomId,
        activeView: 'cartelera',
        mobileView: 'chat',
        selectedUserId: null,
        selectedEventId: null
      });
    }
  },

  deleteMessageForMe: async (messageId: string, roomId: string) => {
    const { currentUser, fetchMessagesForRoom } = get();
    if (!currentUser) return;
    set(state => ({
      messages: {
        ...state.messages,
        [roomId]: (state.messages[roomId] || []).map(m => m.id === messageId ? { ...m, deletedBy: [...(m.deletedBy || []), currentUser.id] } : m)
      }
    }));
    const { deleteMessageForMe: deleteAPI } = await import('@/app/actions/messages');
    await deleteAPI(messageId);
    await fetchMessagesForRoom(roomId);
  },

  deleteMessageForEveryone: async (messageId: string, roomId: string) => {
    set(state => ({
      messages: {
        ...state.messages,
        [roomId]: (state.messages[roomId] || []).map(m => m.id === messageId ? { ...m, isDeleted: true, text: '' } : m)
      }
    }));
    const { deleteMessageForEveryone: deleteAPI } = await import('@/app/actions/messages');
    await deleteAPI(messageId);
    const { fetchMessagesForRoom } = get();
    await fetchMessagesForRoom(roomId);
  }
}))