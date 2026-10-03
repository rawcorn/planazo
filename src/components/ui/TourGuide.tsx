'use client'

import React, { useState, useEffect } from 'react'
import { Joyride, CallBackProps, STATUS, Step, EVENTS, TooltipRenderProps } from 'react-joyride'
import { useUIStore } from '@/store/uiStore'

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
    <div {...tooltipProps} className="bg-[#A698E3] p-6 rounded-[24px] shadow-2xl max-w-sm w-full mx-4 font-sans text-white border border-white/10">
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

  const steps: Step[] = [
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
      disableBeacon: true,
    },
    {
      target: isMobile ? 'body' : '#tour-step-1',
      content: (
        <div className="text-left">
          <h3 className="font-black text-[16px] mb-1.5 text-white">Tus Comunidades</h3>
          <p className="text-white/90 text-[14px] leading-snug font-medium">
            Acá podés ver todas las zonas, los planazos a los que te sumaste y tus chats privados.
          </p>
        </div>
      ),
      placement: isMobile ? 'center' : 'right',
      disableBeacon: true,
    },
    {
      target: isMobile ? 'body' : '#tour-center-header',
      content: (
        <div className="text-left">
          <h3 className="font-black text-[16px] mb-1.5 text-white">El Chat Principal</h3>
          <p className="text-white/90 text-[14px] leading-snug font-medium">
            Acá va a estar el chat de la zona o del Planazo que selecciones.
          </p>
        </div>
      ),
      placement: isMobile ? 'center' : 'bottom',
      disableBeacon: true,
    },
    {
      target: isMobile ? 'body' : '#tour-step-3',
      content: (
        <div className="text-left">
          <h3 className="font-black text-[16px] mb-1.5 text-white">La Cartelera</h3>
          <p className="text-white/90 text-[14px] leading-snug font-medium">
            Acá ves los planes disponibles, los detalles de cada uno y podés editar tu perfil.
          </p>
        </div>
      ),
      placement: isMobile ? 'center' : 'left',
      disableBeacon: true,
    }
  ]

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const { setMobileView } = useUIStore.getState();

    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('hasSeenTour', 'true');
      if (isMobile) {
        setMobileView('chat');
      }
    }
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      scrollToFirstStep={false}
      showProgress={false}
      showSkipButton
      steps={steps}
      tooltipComponent={CustomTooltip}
      styles={{
        options: {
          zIndex: 10000,
          overlayColor: 'rgba(0, 0, 0, 0.6)',
        }
      }}
    />
  )
}
