import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useUIStore } from '@/store/uiStore'
import { useShallow } from 'zustand/react/shallow'
import { Menu, ChevronLeft, Send, MessageSquare, X, CornerUpLeft, CornerUpRight, Copy, Trash2, Calendar } from 'lucide-react'
import { getRegionMemberCount } from '@/app/actions/catalog'

export function CenterColumn() {
  const { 
    currentUser, 
    users, 
    events, 
    myEvents,
    messages, 
    regions,
    dmChannels,
    activeRoomId,
    activeThreadId,
    setActiveThreadId, 
    setMobileView, 
    sendMessage,
    setSelectedEvent,
    setSelectedUser,
    deleteMessageForMe,
    deleteMessageForEveryone,
    resetRightColumn
  } = useUIStore(useShallow(state => ({
    currentUser: state.currentUser,
    users: state.users,
    events: state.events,
    myEvents: state.myEvents,
    messages: state.messages,
    regions: state.regions,
    dmChannels: state.dmChannels,
    activeRoomId: state.activeRoomId,
    activeThreadId: state.activeThreadId,
    setActiveThreadId: state.setActiveThreadId,
    setMobileView: state.setMobileView,
    sendMessage: state.sendMessage,
    setSelectedEvent: state.setSelectedEvent,
    setSelectedUser: state.setSelectedUser,
    deleteMessageForMe: state.deleteMessageForMe,
    deleteMessageForEveryone: state.deleteMessageForEveryone,
    resetRightColumn: state.resetRightColumn
  })))

  const [chatText, setChatText] = useState('');
  const [activeMessageMenu, setActiveMessageMenu] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<any>(null); 
  const [forwardingMsg, setForwardingMsg] = useState<any>(null);
  const [memberCount, setMemberCount] = useState<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeRoomId]);

  useEffect(() => {
    setReplyingTo(null);
    setActiveMessageMenu(null);
    setForwardingMsg(null);
  }, [activeRoomId]);

  useEffect(() => {
    const fetchMemberCount = async () => {
      const activeRegion = regions.find(r => r.room_id === activeRoomId);
      if (activeRegion) {
        const res = await getRegionMemberCount(activeRegion.name);
        setMemberCount(res.count);
      } else {
        setMemberCount(null);
      }
    };
    fetchMemberCount();
  }, [activeRoomId, regions]);

  if (!currentUser) return null;
  if (!activeRoomId) return <div className="flex-1 flex items-center justify-center bg-slate-50"><p className="text-slate-500 font-medium">Selecciona una sala para chatear</p></div>;
  const activeRegion = regions.find(r => r.room_id === activeRoomId);
  const isRegionRoom = !!activeRegion;
  const isEventRoom = !isRegionRoom && (events.some(e => e.id === activeRoomId) || myEvents.some(e => e.id === activeRoomId));
  const isDMRoom = !isRegionRoom && !isEventRoom;

  const activeEvent = isEventRoom ? (events.find(e => e.id === activeRoomId) || myEvents.find(e => e.id === activeRoomId)) : null;
  
  let dmUser = null;
  if (isDMRoom) {
    let otherUserId: string | null = null;
    const dmChannel = dmChannels?.find((ch: any) => ch.rooms?.id === activeRoomId);
    if (dmChannel && (dmChannel as any).other_user_id) {
      otherUserId = (dmChannel as any).other_user_id;
    } else {
      const roomMsgs: any[] = (messages as Record<string, any[]>)?.[activeRoomId] || [];
      const firstOtherMsg = roomMsgs.find(
        (m: any) => (m.senderId || m.sender_id) && (m.senderId || m.sender_id) !== currentUser.id
      );
      if (firstOtherMsg) {
        otherUserId = firstOtherMsg.senderId || firstOtherMsg.sender_id;
      }
    }
    if (otherUserId) dmUser = getUser(otherUserId);
  }
  const roomMessages = messages[activeRoomId] || [];

  const mainMessages = roomMessages.filter(m => !m.deletedBy?.includes(currentUser.id));
  const threadMessages = activeThreadId ? roomMessages.filter(m => (m.parentId === activeThreadId || m.id === activeThreadId) && !m.deletedBy?.includes(currentUser.id)) : [];
  const displayMessages = activeThreadId ? threadMessages : mainMessages;



  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;
    const text = chatText;
    const currentReplyId = replyingTo?.id; 
    setChatText('');
    setReplyingTo(null); 
    await sendMessage(activeRoomId, text, currentReplyId || activeThreadId || undefined);
  };

  function getUser(id: string) {
    return users.find(u => u.id === id) || { username: 'Usuario Desconocido', avatarUrl: '', interests: [], region: '' };
  }

  // --- LÓGICA DE GESTOS ---
  const handlePointerDown = (e: React.TouchEvent | React.MouseEvent, msgId: string) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const target = e.currentTarget as HTMLElement;
    target.dataset.startX = clientX.toString();
    target.dataset.isSwiping = 'true';
    target.style.transition = 'none';

    longPressTimer.current = setTimeout(() => {
      target.dataset.isSwiping = 'false';
      setActiveMessageMenu(msgId);
      setDeleteConfirmId(null);
      if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    }, 450);
  };

  const handlePointerMove = (e: React.TouchEvent | React.MouseEvent) => {
    const target = e.currentTarget as HTMLElement;
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (target.dataset.isSwiping !== 'true') return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const startX = parseFloat(target.dataset.startX || '0');
    let deltaX = clientX - startX;

    if (deltaX < 0) deltaX = 0;
    if (deltaX > 60) deltaX = 60 + (deltaX - 60) * 0.2;

    target.style.transform = `translateX(${deltaX}px)`;
    
    const row = target.closest('.message-row');
    if (row) {
      const icon = row.querySelector('.reply-icon') as HTMLElement;
      if (icon) {
        const opacity = Math.min(deltaX / 40, 1);
        const scale = Math.min(0.5 + (deltaX / 80), 1);
        icon.style.opacity = opacity.toString();
        icon.style.transform = `scale(${scale})`;
      }
    }
  };

  const handlePointerUp = (e: React.TouchEvent | React.MouseEvent, msg: any) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    const target = e.currentTarget as HTMLElement;
    if (target.dataset.isSwiping !== 'true') return;
    target.dataset.isSwiping = 'false';

    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX;
    const startX = parseFloat(target.dataset.startX || '0');
    const deltaX = clientX - startX;

    target.style.transition = 'transform 0.25s cubic-bezier(0.1, 0.7, 0.1, 1)';
    target.style.transform = 'translateX(0px)';

    const row = target.closest('.message-row');
    if (row) {
      const icon = row.querySelector('.reply-icon') as HTMLElement;
      if (icon) {
        icon.style.transition = 'all 0.2s ease-out';
        icon.style.opacity = '0';
        icon.style.transform = 'scale(0.5)';
      }
    }

    if (deltaX > 50) setReplyingTo(msg);
  };
  // ----------------------------------------------

  return (
    <div className="flex flex-col h-full w-full bg-white relative overflow-hidden">

      {/* HEADER */}
      <div className="h-[88px] px-6 border-b border-[#D5CAFA]/30 bg-white flex items-center justify-between z-10 shrink-0">
        {activeThreadId ? (
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveThreadId(null)} className="p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="font-black text-lg text-slate-900">Hilo de conversación</h2>
          </div>
        ) : (
          <div className="flex items-center gap-3 overflow-hidden">
            <button onClick={() => setMobileView('menu')} className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors">
              <Menu className="h-5 w-5" />
            </button>
            
            {(() => {
              let headerIconClass = "h-10 w-10 flex items-center justify-center font-bold shrink-0 overflow-hidden ";
              let headerIconContent = null;
              
              if (isEventRoom && activeEvent) {
                headerIconClass += "rounded-full bg-[#E5D0BA] text-slate-800";
                headerIconContent = activeEvent.imageUrl ? (
                  <img src={activeEvent.imageUrl} alt={activeEvent.title} className="h-full w-full object-cover" />
                ) : (
                  activeEvent.title.charAt(0)
                );
              } else if (isDMRoom && dmUser) {
                headerIconClass += "rounded-full bg-slate-800 text-white";
                headerIconContent = dmUser.avatarUrl ? (
                  <img src={dmUser.avatarUrl} alt={dmUser.username} className="h-full w-full object-cover" />
                ) : (
                  dmUser.username.charAt(0).toUpperCase()
                );
              } else if (isRegionRoom && activeRegion) {
                const pastelIconBgs = ['bg-[#A7F3D0]', 'bg-[#FBCFE8]', 'bg-[#FDE047]', 'bg-[#C7D2FE]', 'bg-[#FECACA]'];
                const bgClass = pastelIconBgs[activeRegion.name.length % pastelIconBgs.length];
                headerIconClass += `rounded-xl ${bgClass} text-lg shadow-sm`;
                
                if (activeRegion.name.includes('CABA')) headerIconContent = '🗺️';
                else if (activeRegion.name.includes('GBA')) headerIconContent = '🏘️';
                else if (activeRegion.name.includes('Córdoba')) headerIconContent = '🏞️';
                else if (activeRegion.name.includes('Mendoza')) headerIconContent = '🍷';
                else if (activeRegion.name.includes('Rosario')) headerIconContent = '🚢';
                else headerIconContent = '📍';
              } else {
                headerIconClass += "rounded-full bg-[#FFB5B5] text-white";
                headerIconContent = '📍';
              }

              return (
                <div className={headerIconClass}>
                  {headerIconContent}
                </div>
              );
            })()}
            <div className="min-w-0">
              <h2 className="font-black text-lg text-[#3f3f46] truncate">
                {isEventRoom ? activeEvent?.title : isDMRoom ? dmUser?.username : activeRegion?.name}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium truncate flex items-center gap-1.5">
                {isEventRoom && activeEvent ? (
                  <>
                    <span>{activeEvent.attendees.length} asist.</span>
                    <span className="text-slate-300">•</span>
                    <Calendar className="h-3 w-3 text-slate-400" />
                    <span>
                      {new Date(activeEvent.date).toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '')} {new Date(activeEvent.date).getDate()}/{new Date(activeEvent.date).getMonth() + 1}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span>
                      {new Date(activeEvent.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </>
                ) : isDMRoom ? (
                  <span>Mensaje Privado</span>
                ) : (
                  <span className="flex items-center gap-1.5 font-medium text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-[#86E2B5]"></span>
                    {memberCount !== null ? `${memberCount >= 1000 ? (memberCount/1000).toFixed(1) + 'k' : memberCount} miembros` : '...'}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}
        {(isEventRoom || isDMRoom) ? (
          <button 
            onClick={() => { resetRightColumn(); if(window.innerWidth < 1024) setMobileView('menu'); }} 
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl flex items-center gap-1 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        ) : (
          <button 
            onClick={() => setMobileView('details')} 
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl flex items-center gap-1 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 rotate-180" />
          </button>
        )}
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 z-0 pb-24 flex flex-col relative">
        
        {/* CAPA INVISIBLE PARA CERRAR EL MENÚ */}
        {activeMessageMenu && (
          <div 
            className="fixed inset-0 z-30"
            onClick={() => {
              setActiveMessageMenu(null);
              setDeleteConfirmId(null);
            }}
          />
        )}

        {displayMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="bg-[#FCF8F2] px-6 py-3 rounded-full text-sm font-medium text-slate-500">
              {activeThreadId ? 'Envía la primera respuesta en este hilo...' : (isDMRoom ? `Empieza a chatear con ${dmUser?.username}...` : `Envía el primer mensaje a ${isEventRoom ? 'este grupo' : 'la zona'}...`)}
            </div>
          </div>
        ) : (
          (() => {
            const isTimeGapTooBig = (time1: string | Date, time2: string | Date) => {
              if (!time1 || !time2) return true;
              const diffInMinutes = (new Date(time2).getTime() - new Date(time1).getTime()) / 1000 / 60;
              return diffInMinutes > 5 || isNaN(diffInMinutes);
            };

            return displayMessages.map((msg, index) => {
              const previousMsg = displayMessages[index - 1];
              const nextMsg = displayMessages[index + 1];

              const isSystem = msg.type === 'system';
              const prevIsSystem = previousMsg?.type === 'system';
              const nextIsSystem = nextMsg?.type === 'system';

              const rawSenderId = isSystem ? null : msg.senderId;
              const prevSenderId = prevIsSystem ? null : previousMsg?.senderId;
              const nextSenderId = nextIsSystem ? null : nextMsg?.senderId;

              const isGroupedWithPrev = !!(previousMsg 
                && prevSenderId 
                && rawSenderId
                && prevSenderId === rawSenderId 
                && !isSystem && !prevIsSystem
                && !isTimeGapTooBig(previousMsg.timestamp, msg.timestamp));

              const isGroupedWithNext = !!(nextMsg 
                && nextSenderId 
                && rawSenderId
                && nextSenderId === rawSenderId
                && !isSystem && !nextIsSystem
                && !isTimeGapTooBig(msg.timestamp, nextMsg.timestamp));

              const linkedEvent = isSystem ? (events.find(e => e.id === msg.eventId) || myEvents.find(e => e.id === msg.eventId)) : null;
              if (isSystem && !linkedEvent) return null;

              const effectiveSenderId = isSystem ? linkedEvent?.creatorId : msg.senderId;
              const isMine = effectiveSenderId === currentUser.id;
              const senderUser = effectiveSenderId === currentUser.id ? currentUser : (effectiveSenderId ? getUser(effectiveSenderId) : null);
              
              const pastelColors = ['bg-[#DCE4FF] text-slate-900', 'bg-[#E6E0FF] text-slate-900', 'bg-[#FCE7F3] text-slate-900'];
              const othersColor = effectiveSenderId ? pastelColors[effectiveSenderId.charCodeAt(0) % pastelColors.length] : pastelColors[0];

              const showAvatar = !isMine && senderUser && !isGroupedWithPrev;
              const showName = !isMine && senderUser && !isGroupedWithPrev;

              const BUBBLE_RADIUS = '18px'; 
              const FLAT_RADIUS = '18px'; 
              const TAIL_RADIUS = '0px'; 

              const canReply = !isSystem && !msg.isDeleted;
              const isMenuActive = activeMessageMenu === msg.id;

              return (
                <div 
                  key={msg.id} 
                  style={{ marginTop: index === 0 ? '0px' : '8px' }}
                  className={`message-row flex w-full relative ${isMine ? 'justify-end' : 'justify-start items-end gap-2'} ${isMenuActive ? 'z-40' : 'z-10'} ${isSystem ? 'opacity-80 hover:opacity-100 transition-opacity' : ''}`}
                >
                  {/* Ícono de Responder oculto para el Swipe */}
                  {canReply && (
                    <div className={`reply-icon absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 opacity-0 scale-50 pointer-events-none z-0 ${isMine ? 'left-4' : 'left-14'}`}>
                      <MessageSquare className="h-4 w-4 text-slate-500" />
                    </div>
                  )}

                  {!isMine && senderUser && (
                    <div 
                      className={`h-9 w-9 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-slate-600 font-bold text-sm z-10 ${!showAvatar ? 'invisible' : (isSystem ? 'bg-slate-100 opacity-60' : 'bg-[#E6E0FF] cursor-pointer shadow-sm')}`}
                      onClick={() => {
                        if (showAvatar && !activeMessageMenu && !isSystem) {
                          setSelectedUser(effectiveSenderId!);
                          if(window.innerWidth < 1024) setMobileView('details');
                        }
                      }}
                    >
                      {showAvatar && (senderUser.avatarUrl ? (
                        <img src={senderUser.avatarUrl} alt={senderUser.username} className={`w-full h-full object-cover ${isSystem ? 'grayscale opacity-70' : ''}`} />
                      ) : (
                        senderUser.username.charAt(0).toUpperCase()
                      ))}
                    </div>
                  )}

                  <div className={`relative group ${isSystem ? 'max-w-[85%]' : 'max-w-[75%]'}`}>
                    {/* LA BURBUJA DEL MENSAJE */}
                    <div 
                      className={`px-4 py-2 relative z-10 touch-pan-y select-none flex flex-col ${
                        isSystem 
                          ? 'bg-slate-50 text-slate-500 border border-slate-200/70 shadow-none' // DISEÑO SUTIL PARA SISTEMA
                          : isMine 
                            ? 'bg-[#D1EBDD] text-slate-900 shadow-sm' 
                            : `${othersColor} shadow-sm`
                      }`}
                      style={{
                        // Si es sistema, las 4 esquinas son redondeadas siempre. Si es texto, aplica la lógica de colitas.
                        borderTopLeftRadius: isSystem ? BUBBLE_RADIUS : (!isMine && isGroupedWithPrev ? FLAT_RADIUS : BUBBLE_RADIUS),
                        borderBottomLeftRadius: isSystem ? BUBBLE_RADIUS : (!isMine ? (isGroupedWithNext ? FLAT_RADIUS : TAIL_RADIUS) : BUBBLE_RADIUS),
                        borderTopRightRadius: isSystem ? BUBBLE_RADIUS : (isMine && isGroupedWithPrev ? FLAT_RADIUS : BUBBLE_RADIUS),
                        borderBottomRightRadius: isSystem ? BUBBLE_RADIUS : (isMine ? (isGroupedWithNext ? FLAT_RADIUS : TAIL_RADIUS) : BUBBLE_RADIUS),
                        WebkitTouchCallout: 'none',
                        WebkitUserSelect: 'none'
                      }}
                      onTouchStart={canReply ? (e) => handlePointerDown(e, msg.id) : undefined}
                      onTouchMove={canReply ? handlePointerMove : undefined}
                      onTouchEnd={canReply ? (e) => handlePointerUp(e, msg) : undefined}
                      onTouchCancel={canReply ? (e) => handlePointerUp(e, msg) : undefined}
                      onMouseDown={canReply ? (e) => handlePointerDown(e, msg.id) : undefined}
                      onMouseMove={canReply ? handlePointerMove : undefined}
                      onMouseUp={canReply ? (e) => handlePointerUp(e, msg) : undefined}
                      onMouseLeave={canReply ? (e) => {
                        if ((e.currentTarget as HTMLElement).dataset.isSwiping === 'true') {
                          handlePointerUp(e, msg);
                        }
                      } : undefined}
                      onContextMenu={(e) => {
                        if (canReply) {
                          e.preventDefault();
                          setActiveMessageMenu(msg.id);
                          setDeleteConfirmId(null);
                        }
                      }}
                    >
                      {/* Ocultamos el nombre de arriba si es sistema, porque ya lo dice adentro */}
                      {showName && !isSystem && (
                        <p 
                          className="text-[12px] font-black mb-0.5 opacity-60 cursor-pointer hover:opacity-100 transition-opacity inline-block"
                          onClick={() => {
                            if (!activeMessageMenu) {
                              setSelectedUser(effectiveSenderId!);
                              if(window.innerWidth < 1024) setMobileView('details');
                            }
                          }}
                        >
                          {senderUser.username}
                        </p>
                      )}
                      
                      {isSystem ? (
                        <div 
                          className="cursor-pointer"
                          onClick={() => {
                            setSelectedEvent(linkedEvent!.id);
                            if(window.innerWidth < 1024) setMobileView('details');
                          }}
                        >
                          <p className="text-[13px] leading-snug break-words whitespace-pre-wrap font-medium text-slate-500">
                            @{senderUser?.username || 'Usuario Desconocido'} ha armado un nuevo planazo. ¡Sumate!
                          </p>
                          <div className="mt-2 p-2 bg-white/60 rounded-xl border border-slate-200/50">
                            <div className="mb-1.5">
                              <span className="text-[9px] font-black uppercase tracking-wider bg-slate-200/60 text-slate-500 px-2 py-0.5 rounded-full">
                                ✨ Planazo
                              </span>
                            </div>
                            <p className="font-bold text-[13px] text-slate-700">
                              {linkedEvent!.title}
                              {linkedEvent!.description?.match(/<!--edited.*?-->/) && (() => {
                                const match = linkedEvent!.description.match(/<!--edited:(.*?)-->/);
                                const edits = match ? match[1] : '';
                                return (
                                  <span className="ml-2 bg-slate-200 text-slate-500 text-[8px] px-1.5 py-0.5 rounded uppercase font-bold border border-slate-300">
                                    {edits && edits !== 'algo' ? `Editado: ${edits}` : 'Editado'}
                                  </span>
                                );
                              })()}
                            </p>
                            {linkedEvent!.description && linkedEvent!.description.replace(/<!--edited.*?-->/g, '').trim() !== '' && (
                              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                {linkedEvent!.description.replace(/<!--edited.*?-->/g, '')}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-end justify-between gap-2 min-w-[60px] w-full">
                          {msg.isDeleted ? (
                            <p className="text-[14px] italic opacity-50 flex items-center gap-1.5 py-0.5">
                              🚫 Este mensaje fue eliminado
                            </p>
                          ) : (
                            <div className="flex flex-col w-full">
                              {msg.parentId && (() => {
                                const quotedMsg = roomMessages.find(m => m.id === msg.parentId);
                                if (!quotedMsg) return null;
                                const quotedUser = getUser(quotedMsg.senderId!);
                                return (
                                  <div className={`mb-1.5 p-2 rounded-lg border-l-4 opacity-90 overflow-hidden ${isMine ? 'bg-[#BCE3CD]/60 border-[#75D1A4]' : 'bg-black/5 border-slate-300'}`}>
                                    <span className="font-bold block mb-0.5 text-[11px] opacity-80" style={{ color: isMine ? '#2E8057' : '#64748b' }}>
                                      {quotedUser.username}
                                    </span>
                                    <span className="line-clamp-3 text-[13px] opacity-90 leading-tight">
                                      {quotedMsg.text || 'Mensaje original'}
                                    </span>
                                  </div>
                                );
                              })()}
                              <p className="text-[15px] leading-snug break-words whitespace-pre-wrap">
                                {msg.text}
                              </p>
                            </div>
                          )}
                          <p className={`text-[10px] font-bold opacity-40 whitespace-nowrap shrink-0 ${msg.isDeleted ? 'mb-0.5' : 'mb-[1px]'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* MENÚ CONTEXTUAL */}
                    {isMenuActive && (
                      <div className={`absolute z-50 flex flex-col gap-2 w-[240px] ${isMine ? 'right-0 items-end' : 'left-0 items-start'} top-full mt-2 animate-in zoom-in-95 duration-200`}>
                        <div className="bg-white px-4 py-2 rounded-full shadow-lg shadow-black/5 border border-slate-100 flex items-center gap-4 overflow-x-auto custom-scrollbar w-max max-w-full">
                          {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                            <button 
                              key={emoji} 
                              onClick={(e) => { e.stopPropagation(); setActiveMessageMenu(null); }} 
                              className="text-2xl hover:scale-125 transition-transform shrink-0"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>

                        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-black/10 border border-slate-100 overflow-hidden text-[15px] font-medium text-slate-700 w-full">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setReplyingTo(msg); setActiveMessageMenu(null); }} 
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-100/60 border-b border-slate-100 transition-colors"
                          >
                            <span>Responder</span>
                            <CornerUpLeft className="w-5 h-5 text-slate-400" />
                          </button>
                          
                          <button 
                            onClick={(e) => { e.stopPropagation(); setForwardingMsg(msg); setActiveMessageMenu(null); }} 
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-100/60 border-b border-slate-100 transition-colors"
                          >
                            <span>Reenviar</span>
                            <CornerUpRight className="w-5 h-5 text-slate-400" />
                          </button>
                          
                          <button 
                            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(msg.text); setActiveMessageMenu(null); }} 
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-100/60 border-b border-slate-100 transition-colors"
                          >
                            <span>Copiar</span>
                            <Copy className="w-5 h-5 text-slate-400" />
                          </button>
                          
                          {deleteConfirmId === msg.id ? (
                            <div className="bg-red-50/90 animate-in slide-in-from-top-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); deleteMessageForMe(msg.id, msg.roomId); setActiveMessageMenu(null); }} 
                                className="w-full text-left px-4 py-3 hover:bg-red-100/50 text-red-600 transition-colors font-medium border-b border-red-100"
                              >
                                Eliminar para mí
                              </button>
                              {isMine && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); deleteMessageForEveryone(msg.id, msg.roomId); setActiveMessageMenu(null); }} 
                                  className="w-full text-left px-4 py-3 hover:bg-red-100/50 text-red-600 transition-colors font-bold"
                                >
                                  Eliminar para todos
                                </button>
                              )}
                            </div>
                          ) : (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(msg.id); }} 
                              className="w-full flex items-center justify-between px-4 py-3 hover:bg-red-50 text-red-500 transition-colors"
                            >
                              <span>Eliminar</span>
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            });
          })()
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT Y BARRA DE RESPUESTA */}
      <div className="bg-white border-t border-[#D5CAFA]/30 z-20 flex flex-col relative">
        {replyingTo && (
          <div className="px-6 pt-3 pb-1 flex items-center justify-between gap-3 bg-slate-50 border-l-4 border-l-[#86E2B5]">
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[#2E8057] text-xs font-bold">
                Respondiendo a {getUser(replyingTo.senderId).username}
              </span>
              <span className="text-slate-600 text-[13px] truncate">
                {replyingTo.text}
              </span>
            </div>
            <button 
              type="button" 
              onClick={() => setReplyingTo(null)} 
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="p-4">
          <form onSubmit={handleSend} className="flex items-center gap-3 max-w-4xl mx-auto">
            <input
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 bg-white border border-slate-200 rounded-full px-6 py-4 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#D5CAFA] focus:ring-4 focus:ring-[#EFE9FB] transition-all"
            />
            <button 
              type="submit" 
              disabled={!chatText.trim()}
              className="h-14 w-14 flex items-center justify-center bg-[#86E2B5] text-white rounded-full hover:bg-[#75D1A4] disabled:opacity-50 transition-colors shrink-0"
            >
              <Send className="h-6 w-6" />
            </button>
          </form>
        </div>
      </div>

      {/* MODAL: REENVIAR */}
      {forwardingMsg && (() => {
        const existingDmUserIds = dmChannels?.map(ch => ch.other_user_id) || [];
        const otherUsers = users.filter(u => u.id !== currentUser.id && !existingDmUserIds.includes(u.id));

        // NUEVO: Buscamos al autor original del mensaje y su zona
        const originalSender = getUser(forwardingMsg.senderId);
        const senderName = originalSender.username || 'Usuario';
        const senderZone = originalSender.region || 'Zona desconocida';
        
        // Armamos el prefijo dinámico
        const forwardPrefix = `↪️ *Reenviado por ${senderName} de ${senderZone}:*\n\n`;

        return (
          <div className="absolute inset-0 z-50 bg-black/40 flex flex-col justify-end" onClick={() => setForwardingMsg(null)}>
            <div 
              className="bg-white p-6 rounded-t-3xl h-[85%] animate-in slide-in-from-bottom flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="font-bold text-lg text-slate-900">Reenviar a...</h3>
                <button onClick={() => setForwardingMsg(null)} className="p-2 bg-slate-100 hover:bg-slate-200 transition-colors rounded-full">
                  <X className="w-4 h-4 text-slate-600"/>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-2">
                
                {/* Zonas Comunitarias */}
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mt-2 mb-2 px-2">Comunidades</h4>
                {regions.map(r => (
                  <button 
                    key={r.room_id}
                    onClick={async () => {
                      // Usamos el nuevo texto personalizado
                      await sendMessage(r.room_id, `${forwardPrefix}${forwardingMsg.text}`);
                      setForwardingMsg(null);
                    }}
                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors text-left border border-transparent hover:border-slate-100"
                  >
                    {(() => {
                      const pastelIconBgs = ['bg-[#A7F3D0]', 'bg-[#FBCFE8]', 'bg-[#FDE047]', 'bg-[#C7D2FE]', 'bg-[#FECACA]'];
                      const bgClass = pastelIconBgs[r.name.length % pastelIconBgs.length];
                      let iconContent = '📍';
                      if (r.name.includes('CABA')) iconContent = '🗺️';
                      else if (r.name.includes('GBA')) iconContent = '🏘️';
                      else if (r.name.includes('Córdoba')) iconContent = '🏞️';
                      else if (r.name.includes('Mendoza')) iconContent = '🍷';
                      else if (r.name.includes('Rosario')) iconContent = '🚢';
                      
                      return (
                        <div className={`w-12 h-12 rounded-xl ${bgClass} flex items-center justify-center text-xl shadow-sm shrink-0`}>
                          {iconContent}
                        </div>
                      );
                    })()}
                    <div className="min-w-0">
                      <span className="font-bold text-slate-800 block truncate">{r.name}</span>
                      <span className="text-xs text-slate-500">Sala pública</span>
                    </div>
                  </button>
                ))}

                {/* Chats Privados Activos */}
                {dmChannels && dmChannels.length > 0 && (
                  <>
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mt-6 mb-2 px-2">Chats Recientes</h4>
                    {dmChannels.map(ch => {
                      const u = getUser(ch.other_user_id);
                      if (!ch.rooms?.id) return null;
                      return (
                        <button 
                          key={ch.rooms.id}
                          onClick={async () => {
                            // Usamos el nuevo texto personalizado
                            await sendMessage(ch.rooms.id, `${forwardPrefix}${forwardingMsg.text}`);
                            setForwardingMsg(null);
                          }}
                          className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors text-left border border-transparent hover:border-slate-100"
                        >
                          <div className="w-12 h-12 rounded-full bg-[#E6E0FF] overflow-hidden flex items-center justify-center text-slate-600 font-bold shadow-sm shrink-0">
                            {u.avatarUrl ? <img src={u.avatarUrl} alt={u.username} className="w-full h-full object-cover"/> : u.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-800 truncate block">{u.username}</span>
                        </button>
                      )
                    })}
                  </>
                )}

                {/* Otros Usuarios en la App */}
                {otherUsers.length > 0 && (
                  <>
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mt-6 mb-2 px-2">Otros Usuarios</h4>
                    {otherUsers.map(u => (
                      <button 
                        key={u.id}
                        onClick={async () => {
                          import('@/app/actions/messages').then(async ({ getOrCreateDMRoom }) => {
                            const res = await getOrCreateDMRoom(u.id);
                            if (res.roomId) {
                              // Usamos el nuevo texto personalizado
                              await sendMessage(res.roomId, `${forwardPrefix}${forwardingMsg.text}`);
                              setForwardingMsg(null);
                            }
                          });
                        }}
                        className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors text-left border border-transparent hover:border-slate-100"
                      >
                        <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-slate-500 font-bold shadow-sm shrink-0">
                          {u.avatarUrl ? <img src={u.avatarUrl} alt={u.username} className="w-full h-full object-cover"/> : u.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-800 truncate block">{u.username}</span>
                      </button>
                    ))}
                  </>
                )}

              </div>
            </div>
          </div>
        );
      })()}

    </div>
  )
}
