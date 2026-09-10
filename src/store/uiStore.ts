/* eslint-disable */
import { create } from 'zustand'
import { createEvent, joinEvent, leaveEvent, getEventsByRegion } from '@/app/actions/events'
import { sendMessage, getRoomMessages, getOrCreateDMRoom } from '@/app/actions/messages'
import { getRegions, getInterests } from '@/app/actions/catalog'
import { uploadImage } from '@/app/actions/storage'
import { signOut } from '@/app/actions/auth'

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
export type RightColumnView = 'cartelera' | 'create_event' | 'event_details' | 'profile'

interface AppState {
  currentUser: User | null
  users: User[]
  events: Event[]
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
  joinEvent: (eventId: string) => Promise<void>
  leaveEvent: (eventId: string) => Promise<void>
  sendMessage: (roomId: string, text: string, parentId?: string) => Promise<void>
  startDirectMessage: (targetUserId: string) => Promise<void>
  fetchEventsForRegion: (regionId: string) => Promise<void>
  fetchMessagesForRoom: (roomId: string) => Promise<void>
  deleteMessageForMe: (messageId: string, roomId: string) => Promise<void>
  deleteMessageForEveryone: (messageId: string, roomId: string) => Promise<void>
}

export const useUIStore = create<AppState>((set, get) => ({
  currentUser: null,
  users: [],
  events: [],
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
    const { activeRoomId, events, regions } = get();
    let targetRoom = activeRoomId;
    
    // Check if active room is a region room
    const isRegionRoom = regions.some(r => r.room_id === activeRoomId);
    
    if (!isRegionRoom) {
       const activeEvent = events.find(ev => ev.id === activeRoomId);
       if (activeEvent) {
         const reg = regions.find(r => r.id === activeEvent.region);
         if (reg) targetRoom = reg.room_id;
       } else {
         targetRoom = regions[0]?.room_id || '';
       }
    }
    set({ 
      activeView: 'cartelera', 
      selectedEventId: null, 
      selectedUserId: null, 
      activeRoomId: targetRoom,
      mobileView: 'chat'
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
    if (eventData.imageUrl && eventData.imageUrl.startsWith('data:')) {
      const publicUrl = await uploadImage(eventData.imageUrl, 'event_images');
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
       return { id: res.event.id };
    }
    return { error: 'Error desconocido' };
  },

  joinEvent: async (eventId) => {
    const { fetchEventsForRegion, events } = get();
    await joinEvent(eventId);
    const ev = events.find(e => e.id === eventId);
    if(ev) await fetchEventsForRegion(ev.region);
  },

  leaveEvent: async (eventId) => {
    const { fetchEventsForRegion, events } = get();
    await leaveEvent(eventId);
    const ev = events.find(e => e.id === eventId);
    if(ev) await fetchEventsForRegion(ev.region);
  },

  // ¡ESTA ES LA FUNCIÓN CORREGIDA!
  sendMessage: async (roomId, text, parentId) => {
    // 1. Llama a la acción real del backend (importada arriba de todo)
    await sendMessage(roomId, text, parentId);
    
    // 2. Refresca la lista de mensajes de la base de datos
    const { fetchMessagesForRoom } = get();
    await fetchMessagesForRoom(roomId);
  },

  fetchEventsForRegion: async (regionId: string) => {
    const res = await getEventsByRegion(regionId);
    if (res.events) {
       const newUsers: User[] = [];
       const mapped: Event[] = res.events.map((e: any) => {
          if (e.creator) {
             newUsers.push({
               id: e.creator_id,
               username: e.creator.username,
               avatarUrl: e.creator.avatar_url,
               email: '', age: 0, gender: 'X', region: '', interests: []
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
                   email: '', region: '', interests: []
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

  fetchMessagesForRoom: async (roomId: string) => {
    const res = await getRoomMessages(roomId);
    if (res.messages) {
        const newUsers: User[] = [];
        const mapped: Message[] = res.messages.map((m: any) => {
           const rawSender = m.sender || m.users;
           if (m.sender_id && rawSender) {
              const senderObj = Array.isArray(rawSender) ? rawSender[0] : rawSender;
              newUsers.push({
                 id: m.sender_id,
                 username: senderObj?.username || 'Usuario Desconocido',
                 avatarUrl: senderObj?.avatar_url || '',
                 email: '', age: 0, gender: 'X', region: senderObj?.region || '', interests: []
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