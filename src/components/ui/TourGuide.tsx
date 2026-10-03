'use client'

import React, { useState, useEffect } from 'react'
import { Joyride, CallBackProps, STATUS, Step, EVENTS } from 'react-joyride'
import { useUIStore } from '@/store/uiStore'

export function TourGuide() {
  const [run, setRun] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  
  useEffect(() => {
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
        <div className="text-center font-medium">
          <h2 className="text-[17px] font-black mb-1 text-white leading-tight">¡Bienvenido a Planazo! 🎉</h2>
          <p className="text-white/90 text-[13px] leading-snug">
            Hagamos un recorrido súper rápido para que sepas cómo usar la app.
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '#tour-step-1',
      content: (
        <div className="font-medium text-left">
          <h3 className="font-black text-[15px] mb-1 text-white">Tus Comunidades</h3>
          <p className="text-white/90 text-[13px] leading-snug">
            Acá podés ver todas las zonas, los planazos a los que te sumaste y tus chats privados.
          </p>
        </div>
      ),
      placement: window.innerWidth < 1024 ? 'center' : 'right',
    },
    {
      target: '#tour-step-2',
      content: (
        <div className="font-medium text-left">
          <h3 className="font-black text-[15px] mb-1 text-white">El Chat Principal</h3>
          <p className="text-white/90 text-[13px] leading-snug">
            En este espacio vas a poder hablar con la gente de cada zona o planazo.
          </p>
        </div>
      ),
      placement: 'center', // Fix: Centrado para que no aparezca abajo del viewport
    },
    {
      target: '#tour-step-3',
      content: (
        <div className="font-medium text-left">
          <h3 className="font-black text-[15px] mb-1 text-white">La Cartelera</h3>
          <p className="text-white/90 text-[13px] leading-snug">
            Acá ves los planes disponibles, los detalles de cada uno y podés editar tu perfil.
          </p>
        </div>
      ),
      placement: window.innerWidth < 1024 ? 'center' : 'left',
    }
  ]

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, index, type } = data;
    const { setMobileView } = useUIStore.getState();

    if (type === EVENTS.STEP_BEFORE) {
      if (window.innerWidth < 1024) {
        if (index === 1) setMobileView('menu');
        if (index === 2) setMobileView('chat');
        if (index === 3) setMobileView('details');
      }
    }

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      setStepIndex(index + (action === 'prev' ? -1 : 1));
    }

    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('hasSeenTour', 'true');
      if (window.innerWidth < 1024) {
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
      stepIndex={stepIndex}
      scrollToFirstStep={false}
      showProgress={false}
      showSkipButton
      steps={steps}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#86E2B5', // Verde de los botones
          textColor: '#ffffff', // Letra blanca
          backgroundColor: '#A698E3', // Lila pastel un poco más oscuro para buen contraste con blanco
          overlayColor: 'rgba(0, 0, 0, 0.5)',
        },
        buttonNext: {
          backgroundColor: '#86E2B5',
          color: '#224031',
          fontWeight: '900',
          borderRadius: '99px',
          padding: '6px 14px',
          fontSize: '12px',
          boxShadow: '0 4px 10px rgba(134, 226, 181, 0.4)'
        },
        buttonBack: {
          color: '#ffffff',
          marginRight: '12px',
          fontSize: '12px',
          opacity: 0.8
        },
        buttonSkip: {
          color: '#ffffff',
          fontSize: '12px',
          opacity: 0.6
        },
        tooltip: {
          borderRadius: '20px',
          padding: '16px',
          boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)',
          maxWidth: '300px'
        },
        tooltipContainer: {
          textAlign: 'left',
        },
      }}
      locale={{
        back: 'Atrás',
        close: 'Cerrar',
        last: 'Terminar',
        next: 'Siguiente',
        skip: 'Omitir',
      }}
    />
  )
}
