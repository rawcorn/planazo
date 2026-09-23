/* eslint-disable */
import React, { useEffect, useRef, useState } from 'react'

interface IosTimePickerProps {
  hour: string;
  minute: string;
  onHourChange: (h: string) => void;
  onMinuteChange: (m: string) => void;
  selectedDate?: string;
  hasError?: boolean;
}

export function IosTimePicker({ hour, minute, onHourChange, onMinuteChange, selectedDate, hasError }: IosTimePickerProps) {
  const hourRef = useRef<HTMLDivElement>(null);
  const minRef = useRef<HTMLDivElement>(null);

  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const currentHour = new Date().getHours();
  const currentMinute = new Date().getMinutes();

  const hours = Array.from({ length: 24 })
    .map((_, i) => i.toString().padStart(2, '0'))
    .filter(h => !isToday || parseInt(h, 10) >= currentHour);

  const minutes = Array.from({ length: 60 })
    .map((_, i) => i.toString().padStart(2, '0'))
    .filter(m => !isToday || parseInt(hour || '12', 10) > currentHour || parseInt(m, 10) >= currentMinute);

  const ITEM_HEIGHT = 36; // px

  // Initialize with some default if empty or if invalid due to filtering
  useEffect(() => {
    if ((!hour || !hours.includes(hour)) && hours.length > 0) {
      onHourChange(hours[0]);
    }
  }, [hours, hour, onHourChange]);

  useEffect(() => {
    if ((!minute || !minutes.includes(minute)) && minutes.length > 0) {
      onMinuteChange(minutes[0]);
    }
  }, [minutes, minute, onMinuteChange]);

  useEffect(() => {
    if (hourRef.current && hour && hours.includes(hour)) {
      const idx = hours.indexOf(hour);
      if (idx !== -1 && Math.round(hourRef.current.scrollTop / ITEM_HEIGHT) !== idx) {
        hourRef.current.scrollTop = idx * ITEM_HEIGHT;
      }
    }
  }, [hour]);

  useEffect(() => {
    if (minRef.current && minute && minutes.includes(minute)) {
      const idx = minutes.indexOf(minute);
      if (idx !== -1 && Math.round(minRef.current.scrollTop / ITEM_HEIGHT) !== idx) {
        minRef.current.scrollTop = idx * ITEM_HEIGHT;
      }
    }
  }, [minute]);

  const handleScrollHour = () => {
    if (!hourRef.current) return;
    const scrollY = hourRef.current.scrollTop;
    const activeIdx = Math.round(scrollY / ITEM_HEIGHT);
    if (hours[activeIdx] && hours[activeIdx] !== hour) {
      onHourChange(hours[activeIdx]);
    }
  }

  const handleScrollMinute = () => {
    if (!minRef.current) return;
    const scrollY = minRef.current.scrollTop;
    const activeIdx = Math.round(scrollY / ITEM_HEIGHT);
    if (minutes[activeIdx] && minutes[activeIdx] !== minute) {
      onMinuteChange(minutes[activeIdx]);
    }
  }

  const renderWheel = (
    items: string[], 
    selectedValue: string, 
    ref: React.RefObject<HTMLDivElement | null>, 
    onScroll: () => void,
    label: string,
    isHour: boolean
  ) => {
    return (
      <div className="relative flex flex-col items-center">
        <div 
          ref={ref}
          onScroll={onScroll}
          className="h-[108px] w-[55px] overflow-y-scroll overflow-x-hidden touch-pan-y snap-y snap-mandatory scroll-smooth hide-scrollbar relative z-10"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="h-[36px]"></div>
          {items.map(val => {
            return (
              <div 
                key={val} 
                className={`h-[36px] flex items-center justify-center snap-center text-lg transition-all duration-150 select-none 
                  ${val === selectedValue ? 'font-black text-slate-800 scale-110' : 'text-slate-400 font-medium scale-90 opacity-70'}
                `}
              >
                {val}
              </div>
            );
          })}
          <div className="h-[36px]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex justify-center items-center gap-4 bg-slate-100 border ${hasError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200'} rounded-2xl p-3 relative shadow-inner overflow-hidden max-w-[200px] mx-auto transition-all`}>
      {/* Central Highlight Bar */}
      <div className={`absolute top-1/2 left-0 w-full h-[36px] -translate-y-1/2 rounded-xl pointer-events-none border-y shadow-sm z-0 ${hasError ? 'bg-rose-100/50 border-rose-200/50' : 'bg-white/60 border-slate-200'}`}></div>
      
      {renderWheel(hours, hour, hourRef, handleScrollHour, "Hora", true)}
      
      <div className="font-black text-2xl text-slate-500 pb-1 z-10 animate-pulse">:</div>
      
      {renderWheel(minutes, minute, minRef, handleScrollMinute, "Min", false)}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
