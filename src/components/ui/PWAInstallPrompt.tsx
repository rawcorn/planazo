"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

export function PWAInstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed previously
    if (localStorage.getItem('pwa-prompt-dismissed-v2') === 'true') {
      setIsDismissed(true);
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsStandalone(true);
    }

    // Detect iOS
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Listen for beforeinstallprompt for Android/Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Listen for successful install to hide instantly
    const handleAppInstalled = () => {
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSPrompt(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-prompt-dismissed-v2', 'true');
    setIsDismissed(true);
  };

  // Do not render if already installed or dismissed
  if (isStandalone || isDismissed) {
    return null;
  }

  // Hide button if not iOS and the install prompt isn't ready
  if (!isIOS && !deferredPrompt) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-[60] flex items-center rounded-full bg-blue-200 p-1 pl-2 text-blue-900 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500 hover:scale-105 transition-transform">
        <button
          onClick={handleInstallClick}
          className="flex items-center justify-center gap-2 rounded-full px-3 py-2 transition-colors hover:bg-blue-300/50 active:scale-95"
        >
          <Download size={20} />
          <span className="font-medium pr-1">Instalar App</span>
        </button>
        
        <div className="h-6 w-[1px] bg-blue-300 mx-1"></div>
        
        <button
          onClick={handleDismiss}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-blue-300/50 active:scale-95"
          aria-label="Cerrar sugerencia de instalación"
        >
          <X size={18} />
        </button>
      </div>

      {/* iOS Instructional Modal */}
      {showIOSPrompt && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowIOSPrompt(false)}
              className="absolute top-4 right-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E5F9F0] text-[#4BB584]">
              <Download size={32} />
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">Instalar Planazo</h3>
            <p className="mb-6 text-gray-600">
              Para instalar esta app, presiona el ícono <span className="inline-flex items-center align-middle rounded bg-gray-100 p-1 mx-1"><Share size={16} /></span> <strong>Compartir</strong> en la barra de navegación inferior de Safari y luego selecciona <strong>"Agregar a inicio"</strong>.
            </p>
            <button
              onClick={() => setShowIOSPrompt(false)}
              className="w-full rounded-xl bg-[#86E2B5] py-3.5 font-bold text-white shadow-md hover:bg-[#75D1A4] transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
