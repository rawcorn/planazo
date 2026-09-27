"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

export function PWAInstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
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

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
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

  // Do not render if already installed
  if (isStandalone) {
    return null;
  }

  // Hide button if not iOS and the install prompt isn't ready
  // This prevents the button from doing nothing on unsupported browsers
  if (!isIOS && !deferredPrompt) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
      >
        <Download size={20} />
        <span className="font-medium">Instalar App</span>
      </button>

      {/* iOS Instructional Modal */}
      {showIOSPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center">
            <button 
              onClick={() => setShowIOSPrompt(false)}
              className="absolute top-4 right-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Download size={32} />
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">Instalar Planazo</h3>
            <p className="mb-6 text-gray-600">
              Para instalar esta app, presiona el ícono <span className="inline-flex items-center align-middle rounded bg-gray-100 p-1 mx-1"><Share size={16} /></span> <strong>Compartir</strong> en la barra de navegación inferior de Safari y luego selecciona <strong>"Agregar a inicio"</strong>.
            </p>
            <button
              onClick={() => setShowIOSPrompt(false)}
              className="w-full rounded-xl bg-blue-600 py-3.5 font-semibold text-white shadow-md hover:bg-blue-700 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
