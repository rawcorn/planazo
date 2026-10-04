'use client'

import { useState, useEffect } from 'react'
import { LeftColumn } from '@/components/layout/LeftColumn'
import { CenterColumn } from '@/components/layout/CenterColumn'
import { RightColumn } from '@/components/layout/RightColumn'
import { LoginView } from '@/components/auth/LoginView'
import { RegisterView } from '@/components/auth/RegisterView'
import dynamic from 'next/dynamic'
import { useUIStore } from '@/store/uiStore'

const TourGuide = dynamic(() => import('@/components/ui/TourGuide').then(mod => mod.TourGuide), { ssr: false })

import { getCurrentUser } from '@/app/actions/users'
import { getDMChannels } from '@/app/actions/messages'
import { createClient as createBrowserClient } from '@/lib/supabase/client'

export default function Home() {
  const currentUser = useUIStore(state => state.currentUser)
  const mobileView = useUIStore(state => state.mobileView)
  const login = useUIStore(state => state.login)
  
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [loadingApp, setLoadingApp] = useState(true)

  const activeRoomId = useUIStore(state => state.activeRoomId)
  const fetchEventsForRegion = useUIStore(state => state.fetchEventsForRegion)
  const fetchMessagesForRoom = useUIStore(state => state.fetchMessagesForRoom)
  const loadCatalogs = useUIStore(state => state.loadCatalogs)

  useEffect(() => {
    async function initApp() {
      try {
        await loadCatalogs(); // Always load catalogs first
        const userRes = await getCurrentUser()
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
          })
        }
      } catch (e) {
        console.error("Failed to init", e)
      } finally {
        setLoadingApp(false)
      }
    }
    initApp()
  }, [])

  // Load all per-user data every time a user logs in (page load OR login screen)
  const currentUserId = currentUser?.id
  useEffect(() => {
    if (!currentUserId) return;
    let cancelled = false;
    const supabase = createBrowserClient();
    let dmSub: any = null;

    async function loadUserData() {
      try {
        const state = useUIStore.getState();
        if (state.regions.length === 0) await loadCatalogs();
        const user = useUIStore.getState().currentUser;
        if (!user) return;

        state.resetRightColumn();

        // My Events + DM channels (not blocked by anything else)
        const myEventsPromise = useUIStore.getState().fetchMyEvents();
        const dmPromise = getDMChannels().then(res => {
          if (cancelled || !res.channels) return;
          useUIStore.getState().setDmChannels(res.channels);
          res.channels.forEach((ch: any) => {
            if (ch.rooms?.id) fetchMessagesForRoom(ch.rooms.id).catch(console.error);
          });
        });

        const userRegionObj = useUIStore.getState().regions.find(r => r.name === user.region);
        if (userRegionObj) {
          useUIStore.getState().setActiveRoom(userRegionObj.room_id);
          fetchEventsForRegion(userRegionObj.id).catch(console.error);
        }

        await Promise.all([myEventsPromise, dmPromise]);
      } catch (e) {
        console.error("Failed to load user data", e);
      }
    }
    loadUserData();

    // Realtime: new DM channels + new messages in my DMs
    dmSub = supabase.channel(`dm_updates_${currentUserId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dm_channels' }, async (payload: any) => {
        if (payload.new.user1_id === currentUserId || payload.new.user2_id === currentUserId) {
          const newRes = await getDMChannels();
          if (newRes.channels) useUIStore.getState().setDmChannels(newRes.channels);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload: any) => {
        const roomId = payload.new.room_id;
        const st = useUIStore.getState();
        if (roomId === st.activeRoomId) return; // already handled by the room subscription
        const isMyDm = st.dmChannels.some((ch: any) => ch.rooms?.id === roomId);
        if (isMyDm) {
          st.fetchMessagesForRoom(roomId);
        } else if (payload.new.sender_id !== currentUserId) {
          // Might be a brand-new DM addressed to me: refresh channel list
          const newRes = await getDMChannels();
          if (newRes.channels && newRes.channels.some((ch: any) => ch.rooms?.id === roomId)) {
            useUIStore.getState().setDmChannels(newRes.channels);
            useUIStore.getState().fetchMessagesForRoom(roomId);
          }
        }
      })
      .subscribe();

    return () => {
      cancelled = true;
      if (dmSub) supabase.removeChannel(dmSub);
    };
  }, [currentUserId])

  // Fetch when active room changes
  useEffect(() => {
    if (currentUser && activeRoomId) {
       // if it's a region, fetch events for it
       fetchMessagesForRoom(activeRoomId);
       
       const state = useUIStore.getState();
       state.subscribeToRoom(activeRoomId);
       
       const storeRegions = state.regions;
       const activeRegionObj = storeRegions.find(r => r.room_id === activeRoomId);
       
       if (activeRegionObj) {
          fetchEventsForRegion(activeRegionObj.id);
          state.subscribeToEvents(activeRegionObj.id);
       }
       
       return () => {
         useUIStore.getState().unsubscribeFromRoom();
         useUIStore.getState().unsubscribeFromEvents();
       };
    }
  }, [activeRoomId, currentUser])

  if (loadingApp) {
    return <div className="min-h-screen bg-[#DFD8F7] flex items-center justify-center"><p className="text-[#8D96D6] font-bold">Cargando Planazo...</p></div>
  }

  if (!currentUser) {
    if (authMode === 'login') {
      return <LoginView onSwitchToRegister={() => setAuthMode('register')} />
    } else {
      return <RegisterView onSwitchToLogin={() => setAuthMode('login')} />
    }
  }

    return (
    <main className="flex h-[100dvh] w-full overflow-hidden bg-app-bg text-text-main font-sans selection:bg-purple-300/50">
      <TourGuide />
      {/* Contenedor principal con sombra y bordes redondeados si querés que quede flotando, o que ocupe todo el alto */}
      <div className="relative flex w-full h-full max-w-[1600px] mx-auto bg-card-cream shadow-2xl overflow-hidden">
        
        {/* LEFT COLUMN */}
        <div id="tour-step-1" className={`
          w-full lg:w-80 flex-shrink-0 flex-col h-full bg-card-cream border-r border-purple-100
          lg:relative z-30
          ${mobileView === 'menu' ? 'flex absolute inset-0' : 'hidden lg:flex'}
        `}>
          <LeftColumn />
        </div>

        {/* CENTER COLUMN */}
        <div id="tour-step-2" className={`
          flex-1 flex flex-col min-w-0 h-full bg-white relative z-20
          ${mobileView !== 'chat' ? 'hidden lg:flex' : 'flex'}
        `}>
          <CenterColumn />
        </div>

        {/* RIGHT COLUMN */}
        <div id="tour-step-3" className={`
          w-full lg:w-96 flex-shrink-0 flex-col h-full bg-card-cream border-l border-purple-100
          lg:relative z-30
          ${mobileView === 'details' ? 'flex absolute inset-0' : 'hidden lg:flex'}
        `}>
          <RightColumn />
        </div>
      </div>
    </main>
  )
}