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
    if (localStorage.getItem('pwa-prompt-dismissed') === 'true') {
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
    localStorage.setItem('pwa-prompt-dismissed', 'true');
    setIsDismissed(true);
  };

  // Do not render if already installed or dismissed
  if (isStandalone || isDismissed) {
    return null;
  }

  // Hide button if not iOS and the install prompt isn't ready
  // TEMPORAL: Comentado para que puedas ver el botón en desarrollo
  /*
  if (!isIOS && !deferredPrompt) {
    return null;
  }
  */

  return (
    <>
      <div className="flex items-center justify-between rounded-xl bg-blue-50 p-3 text-blue-900 border border-blue-100 shadow-sm mx-4 mt-2 mb-2 animate-in fade-in duration-500">
        <button
          onClick={handleInstallClick}
          className="flex flex-1 items-center justify-center gap-2 font-medium transition-colors hover:text-blue-700"
        >
          <Download size={18} />
          <span className="text-sm">Instalar App</span>
        </button>
        <button
          onClick={handleDismiss}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-blue-100 hover:text-blue-700 text-blue-400"
          aria-label="Cerrar sugerencia de instalación"
        >
          <X size={16} />
        </button>
      </div>

      {/* iOS Instructional Modal */}
      {showIOSPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center animate-in zoom-in-95 duration-200">
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
