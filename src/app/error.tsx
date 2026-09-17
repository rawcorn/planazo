'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#DFD8F7] flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-lg text-center">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
          ⚠️
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Faltan las Variables de Entorno</h2>
        <p className="text-slate-600 mb-6">
          Vercel no puede conectarse a la base de datos. Para que funcione en producción, debes agregar las variables de Supabase en tu dashboard.
        </p>
        
        <div className="bg-slate-50 p-4 rounded-2xl text-left mb-6 border border-slate-100">
          <p className="text-sm font-bold text-slate-700 mb-2">Pasos a seguir en Vercel:</p>
          <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
            <li>Ve a <strong>Settings</strong> {'>'} <strong>Environment Variables</strong></li>
            <li>Agrega <code className="bg-white px-1.5 py-0.5 rounded border text-purple-600 font-bold">NEXT_PUBLIC_SUPABASE_URL</code></li>
            <li>Agrega <code className="bg-white px-1.5 py-0.5 rounded border text-purple-600 font-bold">NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
            <li>Ve a <strong>Deployments</strong> y haz un <strong>Redeploy</strong></li>
          </ol>
        </div>

        <p className="text-[10px] text-slate-400 mb-6 break-words">
          Detalle técnico: {error.message} {error.digest && `(Digest: ${error.digest})`}
        </p>

        <button
          onClick={() => reset()}
          className="bg-[#86E2B5] text-white px-6 py-3 rounded-full font-bold hover:bg-[#75D1A4] transition-colors w-full"
        >
          Ya las agregué, reintentar
        </button>
      </div>
    </div>
  )
}
