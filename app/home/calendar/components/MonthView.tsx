'use client';

import { useState } from 'react';

interface MonthViewProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onWeekSelect: (date: Date) => void;
  viewMode?: 'day' | 'week';
}

function getMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - ((day + 6) % 7);
  return new Date(date.setDate(diff));
}

function getWeeksOfMonth(month: number, year: number) {
  const weeks: { weekNumber: number; days: Date[] }[] = [];
  let date = new Date(year, month, 1);
  let firstMonday = getMonday(date);
  // Go back to Monday before the 1st if needed
  if (firstMonday.getMonth() !== month) {
    date = firstMonday;
  } else {
    date = new Date(year, month, 1);
  }
  // Loop through weeks
  while (true) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(date);
      d.setDate(date.getDate() + i);
      week.push(d);
    }
    // ISO week number
    const weekNumber = getISOWeekNumber(week[0]);
    weeks.push({ weekNumber, days: week });
    // Next week
    date.setDate(date.getDate() + 7);
    // Stop if we've passed the month and the week doesn't contain any days in the month
    if (week.every(d => d.getMonth() !== month)) break;
  }
  return weeks;
}

function getISOWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export default function MonthView({ selectedDate, onDateSelect, onWeekSelect, viewMode }: MonthViewProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // State for the displayed month
  const [displayedMonth, setDisplayedMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const changeMonth = (offset: number) => {
    setDisplayedMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + offset);
      return newDate;
    });
  };

  // Helper to check if selectedDate is in a given week
  const isDateInWeek = (date: Date, week: Date[]) => {
    return week.some(
      (d) => d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth() && d.getDate() === date.getDate()
    );
  };

  const renderMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthName = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const weeks = getWeeksOfMonth(month, year);
    const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    return (
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <button
            className="px-2 py-1 text-gray-500 hover:text-black focus:outline-none"
            onClick={() => changeMonth(-1)}
            aria-label="Previous month"
            type="button"
          >
            {'<'}
          </button>
          <h2 className="text-base font-semibold select-none">{monthName}</h2>
          <button
            className="px-2 py-1 text-gray-500 hover:text-black focus:outline-none"
            onClick={() => changeMonth(1)}
            aria-label="Next month"
            type="button"
          >
            {'>'}
          </button>
        </div>
        <div className="grid grid-cols-8 gap-px text-xs">
          <div></div>
          {weekDays.map((d, idx) => (
            <div key={d + idx} className="text-center text-gray-500 font-medium w-8">{d}</div>
          ))}
          {weeks.map((week, weekIdx) => {
            // Skip the last week if all days are in the next month
            const isLastWeek = weekIdx === weeks.length - 1;
            const allDaysInNextMonth = week.days.every(day => day.getMonth() !== month);
            if (isLastWeek && allDaysInNextMonth) return null;
            return (
              <div key={week.weekNumber + '-' + weekIdx} className="contents">
                <button
                  type="button"
                  className={`text-center cursor-pointer font-medium select-none focus:outline-none px-1 py-1 w-8
                    ${viewMode === 'week' && isDateInWeek(selectedDate, week.days) ? 'bg-blue-500 text-white rounded' : 'text-gray-400 hover:bg-gray-200 rounded'}
                  `}
                  onClick={() => onWeekSelect(week.days[0])}
                  tabIndex={-1}
                  style={
                    viewMode === 'week' && isDateInWeek(selectedDate, week.days)
                      ? undefined
                      : { background: 'none', border: 'none', padding: 0, margin: 0 }
                  }
                >
                  {week.weekNumber}
                </button>
                {week.days.map((day, i) => {
                  const isCurrentMonth = day.getMonth() === month;
                  const isToday = day.getTime() === today.getTime();
                  const isSelected = day.getTime() === selectedDate.setHours(0,0,0,0);
                  const isPast = day < today;
                  return (
                    <button
                      type="button"
                      key={i + '-' + day.toISOString()}
                      className={`text-center cursor-pointer rounded-full mx-auto w-8 h-8 flex items-center justify-center select-none focus:outline-none
                        ${isCurrentMonth ? '' : 'text-gray-300'}
                        ${isPast && isCurrentMonth ? 'text-gray-400' : ''}
                        ${isToday && isCurrentMonth ? 'border border-blue-500 font-bold' : ''}
                        ${viewMode === 'day' && isSelected && isCurrentMonth ? 'bg-blue-500 text-white font-bold' : ''}
                        ${viewMode === 'week' && isDateInWeek(selectedDate, week.days) ? 'bg-blue-100' : ''}
                        hover:bg-gray-100'
                      `}
                      onClick={() => onDateSelect(day)}
                      tabIndex={-1}
                      style={
                        (viewMode === 'day' && isSelected && isCurrentMonth) || (viewMode === 'week' && isDateInWeek(selectedDate, week.days))
                          ? undefined
                          : { background: 'none', border: 'none', padding: 0, margin: 0 }
                      }
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto pr-3" style={{ width: 320 }}>
      {renderMonth(displayedMonth)}
    </div>
  );
} 