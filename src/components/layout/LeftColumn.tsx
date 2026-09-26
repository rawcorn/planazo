import { useUIStore } from '@/store/uiStore'
import { LogOut, X, MapPin, MessageCircle, Info, Calendar } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'

export function LeftColumn() {
  const { 
    currentUser, 
    events, 
    myEvents,
    messages,
    users,
    regions,
    dmChannels,
    activeRoomId, 
    setActiveRoom, 
    setMobileView, 
    logout,
    setSelectedUser,
    setSelectedEvent,
    selectedEventId
  } = useUIStore(useShallow(state => ({
    currentUser: state.currentUser,
    events: state.events,
    myEvents: state.myEvents,
    messages: state.messages,
    users: state.users,
    regions: state.regions,
    dmChannels: state.dmChannels,
    activeRoomId: state.activeRoomId,
    setActiveRoom: state.setActiveRoom,
    setMobileView: state.setMobileView,
    logout: state.logout,
    setSelectedUser: state.setSelectedUser,
    setSelectedEvent: state.setSelectedEvent,
    selectedEventId: state.selectedEventId
  })))

  if (!currentUser) return null;
  
  const regionRoomIds = regions.map(r => r.room_id);
  const dmRoomIds = Object.keys(messages).filter(id => !regionRoomIds.includes(id) && !events.some(e => e.id === id));
  
  if (!regionRoomIds.includes(activeRoomId) && !events.some(e => e.id === activeRoomId) && !dmRoomIds.includes(activeRoomId)) {
    dmRoomIds.push(activeRoomId);
  }

  return (
    <div className="flex flex-col h-full w-full bg-transparent text-slate-900 border-r border-[#D5CAFA]/30">
      {/* HEADER */}
      <div className="p-5 flex items-center justify-between shrink-0 bg-transparent">
        <div 
          className="flex items-center gap-3 cursor-pointer group p-2 -ml-2 rounded-2xl hover:bg-[#EFE9FB] transition-colors flex-1 min-w-0" 
          onClick={() => {
            setSelectedUser(currentUser.id);
            if(window.innerWidth < 1024) setMobileView('details');
          }}
        >
          {currentUser.avatarUrl ? (
            <img src={currentUser.avatarUrl} alt="avatar" className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="h-12 w-12 bg-[#86E2B5] text-teal-900 rounded-full flex items-center justify-center font-black text-xl">
              {currentUser.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-black text-xl leading-tight text-slate-900 truncate">Planazo</h1>
            <p className="text-xs text-slate-600 font-medium truncate">{currentUser.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={logout} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-[#EFE9FB] rounded-xl transition-colors" title="Cerrar sesión">
            <LogOut className="h-5 w-5" />
          </button>
          <button onClick={() => setMobileView('chat')} className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-[#EFE9FB] rounded-xl transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2 space-y-6">
        
        {/* ZONAS */}
        <div>
          <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 px-3 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" /> Explorar Zonas
          </h2>
          <div className="space-y-1">
            {regions.map(region => {
              const pastelIconBgs = ['bg-[#A7F3D0]', 'bg-[#FBCFE8]', 'bg-[#FDE047]', 'bg-[#C7D2FE]', 'bg-[#FECACA]'];
              const iconBg = pastelIconBgs[region.name.length % pastelIconBgs.length];
              const getIcon = () => {
                if (region.name.includes('CABA')) return '🗺️';
                if (region.name.includes('GBA')) return '🏘️';
                if (region.name.includes('Córdoba')) return '🏞️';
                if (region.name.includes('Mendoza')) return '🍷';
                if (region.name.includes('Rosario')) return '🚢';
                return '📍';
              };
              return (
              <button
                key={region.id}
                onClick={() => { 
                  setActiveRoom(region.room_id); 
                  if(window.innerWidth < 1024) setMobileView('chat');
                }}
                className={`w-full text-left px-4 py-3 rounded-[1.5rem] flex items-center gap-4 transition-colors ${activeRoomId === region.room_id ? 'bg-[#D5CAFA] text-slate-900 font-bold' : 'hover:bg-[#EFE9FB] text-slate-700 font-medium'}`}
              >
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-lg ${activeRoomId === region.room_id ? 'bg-white shadow-sm' : iconBg}`}>
                  {getIcon()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[15px]">{region.name}</p>
                </div>
              </button>
            )})}
          </div>
        </div>

        {/* MIS PLANAZOS */}
        <div>
          <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 px-3 flex items-center gap-1.5">
            <span className="text-amber-500 text-sm">✨</span> Mis Planazos
          </h2>
          {myEvents.length === 0 ? (
            <div className="px-3 py-5 bg-[#EFE9FB]/50 rounded-2xl text-center">
              <p className="text-sm text-slate-500">No estás anotado en nada.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {myEvents.map(event => (
                <div key={event.id} className={`w-full flex items-center p-2 mb-2 rounded-[1.2rem] border transition-all ${activeRoomId === event.id ? 'bg-[#F8F5FF] border-[#D5CAFA] shadow-sm' : 'bg-white border-transparent hover:border-slate-100 hover:bg-slate-50 hover:shadow-sm'}`}>
                  <div className="flex-1 flex items-center gap-3 min-w-0 pr-2">
                    <div className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center font-bold overflow-hidden bg-slate-100 text-slate-700 shadow-inner">
                      {event.imageUrl ? <img src={event.imageUrl} alt={event.title} className="h-full w-full object-cover" /> : event.title.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`truncate text-[14px] ${activeRoomId === event.id ? 'font-bold text-violet-900' : 'font-semibold text-slate-800'}`}>{event.title}</p>
                      <p className={`text-[11px] truncate flex items-center gap-1 mt-0.5 ${activeRoomId === event.id ? 'text-violet-600' : 'text-slate-500'}`}>
                        <Calendar className="h-3 w-3" />
                        {new Date(event.date).toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '')} {new Date(event.date).getDate()}/{new Date(event.date).getMonth() + 1}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setSelectedEvent(event.id);
                        setActiveRoom(event.id);
                        if(window.innerWidth < 1024) setMobileView('details');
                      }}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-xl transition-all ${selectedEventId === event.id ? 'bg-violet-600 text-white shadow-md' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                    >
                      Detalles
                    </button>
                    <button
                      onClick={() => { 
                        setActiveRoom(event.id);
                        setSelectedEvent(event.id);
                        if(window.innerWidth < 1024) setMobileView('chat');
                      }}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-xl transition-all ${activeRoomId === event.id ? 'bg-fuchsia-500 text-white shadow-md' : 'bg-slate-100 hover:bg-fuchsia-100 text-slate-600 hover:text-fuchsia-600'}`}
                    >
                      Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DMs */}
        {dmRoomIds.length > 0 && (
          <div>
            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 px-3 flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5" /> Mensajes Privados
            </h2>
            <div className="space-y-1">
              {dmRoomIds.map(dmId => {
                let otherUserId: string | null = null;
                const dmChannel = dmChannels?.find((ch: any) => ch.rooms?.id === dmId);
                if (dmChannel && dmChannel.other_user_id) {
                  otherUserId = dmChannel.other_user_id;
                } else {
                  const firstOtherMsg = messages[dmId]?.find(m => m.senderId && m.senderId !== currentUser.id);
                  if (firstOtherMsg) otherUserId = firstOtherMsg.senderId!;
                }
                
                const otherUser = otherUserId ? users.find(u => u.id === otherUserId) : null;
                if (!otherUser) return null;

                return (
                  <button
                    key={dmId}
                    onClick={() => { 
                      setActiveRoom(dmId);
                      if(window.innerWidth < 1024) setMobileView('chat');
                    }}
                    className={`w-full text-left px-4 py-3 rounded-[1.5rem] flex items-center gap-4 transition-colors ${activeRoomId === dmId ? 'bg-[#D5CAFA] text-slate-900 font-bold' : 'hover:bg-[#EFE9FB] text-slate-700 font-medium'}`}
                  >
                    <div className="h-9 w-9 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center font-bold text-white">
                      {otherUser.avatarUrl ? (
                        <img src={otherUser.avatarUrl} alt={otherUser.username} className="h-full w-full object-cover" />
                      ) : (
                        <span>{otherUser.username.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[15px]">@{otherUser.username}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}