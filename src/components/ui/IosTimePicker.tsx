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
  const ignoreScroll = useRef(false);
  const prevHour = useRef(hour);
  const prevMinute = useRef(minute);

  if (hour !== prevHour.current) {
    ignoreScroll.current = true;
    prevHour.current = hour;
    setTimeout(() => { ignoreScroll.current = false; }, 250);
  }
  if (minute !== prevMinute.current) {
    ignoreScroll.current = true;
    prevMinute.current = minute;
    setTimeout(() => { ignoreScroll.current = false; }, 250);
  }

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const isToday = selectedDate === todayStr;
  const currentHour = new Date().getHours();
  const currentMinute = new Date().getMinutes();

  const hours = Array.from({ length: 24 })
    .map((_, i) => i.toString().padStart(2, '0'))
    .filter(h => !isToday || parseInt(h, 10) >= currentHour);

  const minutes = Array.from({ length: 60 })
    .map((_, i) => i.toString().padStart(2, '0'))
    .filter(m => !isToday || parseInt(hour || '12', 10) > currentHour || parseInt(m, 10) >= currentMinute);

  const ITEM_HEIGHT = 36; // px

  // Initialize with intelligent default ONLY when date is selected
  useEffect(() => {
    if (!hour && hours.length > 0 && selectedDate) {
      const defaultH = isToday ? String(new Date().getHours()).padStart(2, '0') : '00';
      onHourChange(hours.includes(defaultH) ? defaultH : hours[0]);
    } else if (hour && !hours.includes(hour) && hours.length > 0) {
      onHourChange(hours[0]);
    }
  }, [hours, hour, onHourChange, isToday, selectedDate]);

  useEffect(() => {
    if (!minute && minutes.length > 0 && selectedDate) {
      const defaultM = isToday ? String(new Date().getMinutes()).padStart(2, '0') : '00';
      onMinuteChange(minutes.includes(defaultM) ? defaultM : minutes[0]);
    } else if (minute && !minutes.includes(minute) && minutes.length > 0) {
      onMinuteChange(minutes[0]);
    }
  }, [minutes, minute, onMinuteChange, isToday, selectedDate]);

  useEffect(() => {
    let t: any;
    if (hourRef.current && hour && hours.includes(hour)) {
      const idx = hours.indexOf(hour);
      t = setTimeout(() => {
        if (hourRef.current && Math.round(hourRef.current.scrollTop / ITEM_HEIGHT) !== idx) {
          ignoreScroll.current = true;
            const el = hourRef.current;
            const oldBehavior = el.style.scrollBehavior;
            el.style.scrollBehavior = 'auto'; // Force instant jump
            el.scrollTop = idx * ITEM_HEIGHT;
            setTimeout(() => { 
              if (el) el.style.scrollBehavior = oldBehavior;
              ignoreScroll.current = false; 
            }, 50);
        }
      }, 50);
    }
    return () => clearTimeout(t);
  }, [hour, hours]);

  useEffect(() => {
    let t: any;
    if (minRef.current && minute && minutes.includes(minute)) {
      const idx = minutes.indexOf(minute);
      t = setTimeout(() => {
        if (minRef.current && Math.round(minRef.current.scrollTop / ITEM_HEIGHT) !== idx) {
          ignoreScroll.current = true;
            const el = minRef.current;
            const oldBehavior = el.style.scrollBehavior;
            el.style.scrollBehavior = 'auto'; // Force instant jump
            el.scrollTop = idx * ITEM_HEIGHT;
            setTimeout(() => { 
              if (el) el.style.scrollBehavior = oldBehavior;
              ignoreScroll.current = false; 
            }, 50);
        }
      }, 50);
    }
    return () => clearTimeout(t);
  }, [minute, minutes]);

  const handleScrollHour = () => {
    if (!hourRef.current || ignoreScroll.current) return;
    const scrollY = hourRef.current.scrollTop;
    const activeIdx = Math.round(scrollY / ITEM_HEIGHT);
    if (hours[activeIdx] && hours[activeIdx] !== hour) {
      onHourChange(hours[activeIdx]);
    }
  }

  const handleScrollMinute = () => {
    if (!minRef.current || ignoreScroll.current) return;
    const scrollY = minRef.current.scrollTop;
    const activeIdx = Math.round(scrollY / ITEM_HEIGHT);
    if (minutes[activeIdx] && minutes[activeIdx] !== minute) {
      onMinuteChange(minutes[activeIdx]);
    }
  }

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>, targetRef: React.RefObject<HTMLDivElement | null>) => {
    if (!targetRef.current) return;
    const el = targetRef.current;
    const startY = e.pageY;
    const startScrollTop = el.scrollTop;

    el.style.scrollBehavior = 'auto';
    el.style.scrollSnapType = 'none';

    const onMouseMove = (moveEvent: MouseEvent) => {
      const y = moveEvent.pageY;
      const walk = (y - startY) * 1.5;
      el.scrollTop = startScrollTop - walk;
    };

    const onMouseUp = () => {
      el.style.scrollBehavior = 'smooth';
      el.style.scrollSnapType = 'y mandatory';
      const activeIdx = Math.round(el.scrollTop / ITEM_HEIGHT);
      el.scrollTo({ top: activeIdx * ITEM_HEIGHT, behavior: 'smooth' });
      
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

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
          onMouseDown={(e) => handleDragStart(e, ref)}
          className="h-[108px] w-[55px] overflow-y-scroll overflow-x-hidden touch-pan-y overscroll-y-contain snap-y snap-mandatory hide-scrollbar relative z-10 cursor-grab active:cursor-grabbing"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="h-[36px]"></div>
          {items.map(val => {
            return (
              <div 
                key={val} 
                onClick={() => {
                  const idx = items.indexOf(val);
                  if (ref.current) {
                    ref.current.scrollTo({ top: idx * ITEM_HEIGHT, behavior: 'smooth' });
                  }
                }}
                className={`h-[36px] flex items-center justify-center snap-center text-lg transition-all duration-150 select-none cursor-pointer
                  ${val === selectedValue ? 'font-black text-slate-800 scale-110' : 'text-slate-400 font-medium scale-90 opacity-70 hover:text-slate-600 hover:opacity-100'}
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
