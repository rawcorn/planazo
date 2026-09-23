import React, { useState, useEffect, useRef } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, isBefore, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  hasError?: boolean;
}

export function DatePicker({ value, onChange, hasError }: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value + 'T00:00:00') : new Date());
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedDate = value ? new Date(value + 'T00:00:00') : null;
  const today = startOfDay(new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const isCurrentMonthActive = isSameMonth(currentMonth, today);
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  
  const startDate = isCurrentMonthActive 
    ? startOfWeek(today, { weekStartsOn: 1 }) 
    : startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = "d";
  const rows = [];
  let days = [];
  let day = startDate;
  let formattedDate = "";

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat);
      const cloneDay = day;
      const isDisabled = isBefore(day, today);
      const isSelected = selectedDate && isSameDay(day, selectedDate);
      const isCurrentMonth = isSameMonth(day, monthStart);

      days.push(
        <button
          type="button"
          key={day.toString()}
          disabled={isDisabled}
          onClick={() => {
            onChange(format(cloneDay, 'yyyy-MM-dd'));
            setIsOpen(false);
          }}
          className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium transition-colors
            ${!isCurrentMonth ? 'text-slate-300' : isDisabled ? 'text-slate-300 cursor-not-allowed opacity-50' : 'text-slate-700 hover:bg-slate-100'}
            ${isSelected ? 'bg-[#9fbdd0] text-slate-900 shadow-sm font-bold' : ''}
            ${isSameDay(day, today) && !isSelected ? 'border border-[#9fbdd0] text-[#86aec6]' : ''}
          `}
        >
          {formattedDate}
        </button>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="grid grid-cols-7 gap-1 mb-1" key={day.toString()}>
        {days}
      </div>
    );
    days = [];
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-100 border ${hasError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200'} rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all flex items-center gap-3 shadow-sm hover:bg-slate-50`}
      >
        <CalendarIcon className="h-5 w-5 text-sky-500" />
        <span className="font-medium capitalize">
          {value ? format(new Date(value + 'T00:00:00'), "EEEE d/M", { locale: es }) : "Seleccionar fecha"}
        </span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" onClick={() => setIsOpen(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-6 w-[320px] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-5 px-1">
              <button type="button" onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="font-bold text-slate-800 capitalize text-base">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </span>
              <button type="button" onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-3 text-center">
              {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map(d => (
                <span key={d} className="text-xs font-bold text-slate-400">{d}</span>
              ))}
            </div>
            
            <div className="flex flex-col">
              {rows}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
