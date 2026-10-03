'use client'

import React, { useState, useEffect } from 'react'
import { Joyride, EventData, STATUS, EVENTS, Step, TooltipRenderProps } from 'react-joyride'
import { useUIStore } from '@/store/uiStore'

// ---------------------------------------------------------------------------
// AJUSTES FÁCILES
// "offset" = distancia (en px) entre la tarjeta y la sección iluminada.
// La flechita gorda blanca vive en ese espacio:
//   - número MÁS GRANDE  => la tarjeta (y su flecha) quedan más LEJOS de lo iluminado
//   - número MÁS CHICO   => la tarjeta (y su flecha) quedan más CERCA
// "arrowSpacing" = qué tan corrida hacia la derecha queda la flecha respecto del
// borde izquierdo de la tarjeta (solo en las tarjetas "bottom-start" del chat).
// ---------------------------------------------------------------------------
const OFFSET_DESKTOP = 18
const OFFSET_MOBILE = 18
const CHAT_ARROW_SPACING_DESKTOP = 60 // flecha apuntando al título del chat (PC)
const CHAT_ARROW_SPACING_MOBILE = 90 // flecha apuntando al título del chat (celu)

// Espacio (en px) entre el borde de la tarjeta y la flechita gorda blanca.
// 0 = pegada a la tarjeta · número más grande = más separada.
const ARROW_GAP = 5

// Corre la flecha hacia afuera de la tarjeta según de qué lado está.
const withArrowGap = (s: Step): Step => {
  const side = String(s.placement || '').split('-')[0]
  const transforms: Record<string, string> = {
    bottom: `translateY(-${ARROW_GAP}px)`, // tarjeta abajo, flecha arriba
    top: `translateY(${ARROW_GAP}px)`,
    right: `translateX(-${ARROW_GAP}px)`, // tarjeta a la derecha, flecha a la izquierda
    left: `translateX(${ARROW_GAP}px)`,
  }
  const transform = transforms[side]
  return transform ? { ...s, styles: { ...s.styles, arrow: { transform } } } : s
}

function CustomTooltip({
  index,
  step,
  backProps,
  primaryProps,
  skipProps,
  tooltipProps,
  isLastStep,
}: TooltipRenderProps) {
  return (
    <div
      {...tooltipProps}
      className="bg-[#A698E3] p-6 rounded-[24px] shadow-2xl font-sans text-white border border-white/10"
      style={{ width: 'min(340px, calc(100vw - 32px))' }}
    >
      {step.content}
      <div className="flex items-center justify-between mt-6">
        <div className="flex gap-2">
          {index > 0 && (
            <button {...backProps} className="text-white/80 hover:text-white text-[13px] font-medium px-2 py-1 transition-colors">
              Atrás
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button {...skipProps} className="text-white/70 hover:text-white text-[13px] font-medium px-3 py-1 transition-colors">
            Omitir
          </button>
          <button {...primaryProps} className="bg-[#86E2B5] text-white font-black px-5 py-2 rounded-full text-[13px] hover:bg-[#75D1A4] transition-all shadow-lg shadow-[#86E2B5]/30 hover:scale-105 active:scale-95">
            {isLastStep ? '¡Empezar!' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TourGuide() {
  const [run, setRun] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    setIsMobile(window.innerWidth < 1024)
    const hasSeenTour = localStorage.getItem('hasSeenTour')
    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        setRun(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const steps: Step[] = (isMobile ? [
    {
      target: 'body',
      content: (
        <div className="text-center">
          <h2 className="text-[18px] font-black mb-2 text-white leading-tight">¡Bienvenido a Planazo!</h2>
          <p className="text-white/90 text-[14px] leading-snug font-medium">
            Hagamos un recorrido súper rápido para que sepas cómo usar la app en el celu.
          </p>
        </div>
      ),
      placement: 'center',
    },
    {
      target: '#tour-hamburger',
      content: (
        <div className="text-left">
          <h3 className="font-black text-[16px] mb-1.5 text-white">Tus Zonas y Chats</h3>
          <p className="text-white/90 text-[14px] leading-snug font-medium">
            Tocando este menú vas a poder ver todas las zonas, los Planazos a los que te sumaste y tus chats privados.
          </p>
        </div>
      ),
      placement: 'bottom-start',
      arrowSpacing: 16,
      offset: OFFSET_MOBILE,
    },
    {
      // La tarjeta cuelga del encabezado del chat (la flecha señala el título)
      // y no se oscurece la pantalla para que se vea todo el chat iluminado.
      target: '#tour-center-header',
      content: (
        <div className="text-center">
          <h3 className="font-black text-[16px] mb-1.5 text-white">El Chat Principal</h3>
          <p className="text-white/90 text-[14px] leading-snug font-medium">
            Acá vas a estar viendo el chat de la zona o del Planazo que selecciones.
          </p>
        </div>
      ),
      placement: 'bottom-start',
      arrowSpacing: CHAT_ARROW_SPACING_MOBILE,
      offset: OFFSET_MOBILE,
      hideOverlay: true,
    },
    {
      target: '#tour-right-panel-btn',
      content: (
        <div className="text-left">
          <h3 className="font-black text-[16px] mb-1.5 text-white">La Cartelera</h3>
          <p className="text-white/90 text-[14px] leading-snug font-medium">
            Tocando esta flechita abrís la cartelera con los Planazos de cada zona, sus detalles y tu perfil de usuario cuando lo selecciones.
          </p>
        </div>
      ),
      placement: 'bottom-end',
      arrowSpacing: 16,
      offset: OFFSET_MOBILE,
    }
  ] : [
    {
      target: 'body',
      content: (
        <div className="text-center">
          <h2 className="text-[18px] font-black mb-2 text-white leading-tight">¡Bienvenido a Planazo!</h2>
          <p className="text-white/90 text-[14px] leading-snug font-medium">
            Hagamos un recorrido súper rápido para que sepas cómo usar la app.
          </p>
        </div>
      ),
      placement: 'center',
    },
    {
      target: '#tour-step-1',
      content: (
        <div className="text-left">
          <h3 className="font-black text-[16px] mb-1.5 text-white">Tus Zonas y Chats</h3>
          <p className="text-white/90 text-[14px] leading-snug font-medium">
            Acá podés ver todas las zonas, los Planazos a los que te sumaste y tus chats privados.
          </p>
        </div>
      ),
      placement: 'right',
      offset: OFFSET_DESKTOP,
    },
    {
      // Se ilumina toda la columna central (spotlightTarget) pero la tarjeta
      // se ancla al encabezado: queda dentro de la columna y la flecha señala el título.
      target: '#tour-center-header',
      spotlightTarget: '#tour-step-2',
      content: (
        <div className="text-center">
          <h3 className="font-black text-[16px] mb-1.5 text-white">El Chat Principal</h3>
          <p className="text-white/90 text-[14px] leading-snug font-medium">
            Acá va a estar el chat de la zona o del Planazo que selecciones.
          </p>
        </div>
      ),
      placement: 'bottom-start',
      arrowSpacing: CHAT_ARROW_SPACING_DESKTOP,
      offset: OFFSET_DESKTOP,
    },
    {
      target: '#tour-step-3',
      content: (
        <div className="text-left">
          <h3 className="font-black text-[16px] mb-1.5 text-white">La Cartelera</h3>
          <p className="text-white/90 text-[14px] leading-snug font-medium">
            Acá ves los Planazos por zona, sus detalles y tu perfil de usuario cuando lo selecciones.
          </p>
        </div>
      ),
      placement: 'left',
      offset: OFFSET_DESKTOP,
    }
  ]).map(withArrowGap);

  const handleJoyrideEvent = (data: EventData) => {
    const { status, type } = data;
    const { setMobileView } = useUIStore.getState();

    const finished = status === STATUS.FINISHED || status === STATUS.SKIPPED || type === EVENTS.TOUR_END;
    if (finished) {
      setRun(false);
      localStorage.setItem('hasSeenTour', 'true');
      if (isMobile) {
        setMobileView('chat');
      }
    }
  };

  return (
    <Joyride
      onEvent={handleJoyrideEvent}
      continuous
      run={run}
      scrollToFirstStep={false}
      steps={steps}
      tooltipComponent={CustomTooltip}
      options={{
        zIndex: 10000,
        primaryColor: '#A698E3',
        arrowColor: '#ffffff',
        overlayColor: 'rgba(0, 0, 0, 0.6)',
        skipBeacon: true,
        showProgress: false,
        buttons: ['back', 'skip', 'primary'],
      }}
    />
  )
}
