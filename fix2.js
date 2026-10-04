const fs = require('fs');
let right = fs.readFileSync('src/components/layout/RightColumn.tsx', 'utf8');

right = right.replace(
  /<div className="flex items-center justify-end -mt-2 mb-2">[\s\S]*?<\/div>\s*<\/div>\s*\)\}/,
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
);

right = right.replace(/Loader2 \} from 'lucide-react'/, 'Loader2, Trash2 } from \\'lucide-react\\'');

// Replace "Detalles" button color:
// It looks like: className="w-full py-2.5 bg-[#9fbdd0] hover:bg-[#86aec6] text-white shadow-sm font-bold transition-colors"
right = right.replace(/bg-\[#9fbdd0\] hover:bg-\[#86aec6\]/g, 'bg-[#A698E3] hover:bg-[#9080db]');

fs.writeFileSync('src/components/layout/RightColumn.tsx', right, 'utf8');
