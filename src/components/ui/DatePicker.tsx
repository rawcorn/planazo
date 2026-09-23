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
    <div className={`bg-slate-100 rounded-2xl border p-5 w-full mx-auto ${hasError ? 'border-rose-500 ring-1 ring-rose-500 shadow-sm' : 'border-slate-200 shadow-inner'}`}>
      <div className="flex justify-between items-center mb-5 px-1">
        <button type="button" onClick={prevMonth} className="p-1 hover:bg-white rounded-full text-slate-600 transition-colors shadow-sm">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="font-bold text-slate-800 capitalize text-sm flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-sky-500" />
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </span>
        <button type="button" onClick={nextMonth} className="p-1 hover:bg-white rounded-full text-slate-600 transition-colors shadow-sm">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2 text-center">
        {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map(d => (
          <span key={d} className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{d}</span>
        ))}
      </div>
      
      <div className="flex flex-col">
        {rows}
      </div>
    </div>
  )
}
