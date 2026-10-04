const fs = require('fs');
let right = fs.readFileSync('src/components/layout/RightColumn.tsx', 'utf8');

right = right.replace(
  'const [showDeleteEventModal, setShowDeleteEventModal] = useState(false);',
  'const [showDeleteEventModal, setShowDeleteEventModal] = useState(false);\n  const [showLeaveEventModal, setShowLeaveEventModal] = useState(false);\n  const [isLeaving, setIsLeaving] = useState(false);\n  const [cachedEvent, setCachedEvent] = useState<any>(null);'
);

right = right.replace(
  'const eventToShow = selectedEventId ? (events.find(e => e.id === selectedEventId) || myEvents.find(e => e.id === selectedEventId)) : (isEventRoom ? activeEvent : null);',
  'const rawEventToShow = selectedEventId ? (events.find(e => e.id === selectedEventId) || myEvents.find(e => e.id === selectedEventId)) : (isEventRoom ? activeEvent : null);\n  useEffect(() => {\n    if (rawEventToShow) setCachedEvent(rawEventToShow);\n  }, [rawEventToShow]);\n  const eventToShow = rawEventToShow || (cachedEvent?.id === (selectedEventId || activeEvent?.id) ? cachedEvent : null);'
);

// Add the Leave modal UI right after Delete modal
right = right.replace(
  '{/* MODAL ELIMINAR CUENTA */}',
  {/* MODAL BAJARME DEL EVENTO */}
      {showLeaveEventModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">¿Bajarme del Planazo?</h3>
              <p className="text-sm text-slate-500">
                Si te bajás, vas a perder tu lugar en la lista de asistentes.
              </p>
            </div>
            <div className="flex border-t border-slate-100">
              <button 
                onClick={() => setShowLeaveEventModal(false)}
                disabled={isLeaving}
                className="flex-1 px-4 py-4 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={async () => {
                  if (!eventToShow) return;
                  setIsLeaving(true);
                  if (eventToShow) {
                    setCachedEvent({ ...eventToShow, attendees: eventToShow.attendees.filter((id: string) => id !== currentUser?.id) });
                  }
                  await leaveEvent(eventToShow.id);
                  setShowLeaveEventModal(false);
                  setIsLeaving(false);
                }}
                disabled={isLeaving}
                className="flex-1 px-4 py-4 text-sm font-bold text-orange-500 hover:bg-orange-50 transition-colors border-l border-slate-100"
              >
                {isLeaving ? 'Bajando...' : 'Sí, bajarme'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR CUENTA */}
);

// Update Bajarme del Planazo button
right = right.replace(
  /<button onClick=\{\(\) => leaveEvent\(eventToShow\.id\)\} className="text-\[11px\] text-slate-400 hover:text-rose-500 underline underline-offset-2 transition-colors mt-1 font-medium">\s*Bajarme del Planazo\s*<\/button>/,
  '<button onClick={() => setShowLeaveEventModal(true)} className="text-[11px] text-slate-400 hover:text-rose-500 underline underline-offset-2 transition-colors mt-1 font-medium">Bajarme del Planazo</button>'
);

fs.writeFileSync('src/components/layout/RightColumn.tsx', right, 'utf8');
