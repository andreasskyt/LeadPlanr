'use client';

import { CalendarEvent } from '@/lib/calendar-service';

interface DayWeekViewProps {
  selectedDate: Date;
  viewMode: 'day' | 'week';
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
}

const HOUR_ROW_HEIGHT = 32; // px
const TIME_COL_WIDTH = 48; // px (w-12)

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function getDayStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function getDayEnd(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export default function DayWeekView({ selectedDate, viewMode, events, loading, error }: DayWeekViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Robust week calculation: always returns Monday-Sunday, does not mutate input
  const getWeekDates = (date: Date): Date[] => {
    const d = new Date(date);
    const day = d.getDay();
    // Monday as first day of week
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((day + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const newDate = new Date(monday);
      newDate.setDate(monday.getDate() + i);
      return newDate;
    });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatHeader = (date: Date): string => {
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
    const day = date.getDate();
    return `${weekday} ${day}`;
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Get events for a specific day
  const getEventsForDay = (date: Date): CalendarEvent[] => {
    return events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      // Event overlaps this day
      return (
        eventStart < getDayEnd(date) && eventEnd > getDayStart(date)
      );
    });
  };

  // Render a single event block for a day
  const renderEventBlock = (event: CalendarEvent, day: Date) => {
    const dayStart = getDayStart(day);
    const dayEnd = getDayEnd(day);
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);

    // Clamp event to the current day
    const start = eventStart < dayStart ? dayStart : eventStart;
    const end = eventEnd > dayEnd ? dayEnd : eventEnd;

    const startMinutes = (start.getHours() * 60) + start.getMinutes();
    const endMinutes = (end.getHours() * 60) + end.getMinutes();
    const topPx = (startMinutes / 60) * HOUR_ROW_HEIGHT;
    const heightPx = ((endMinutes - startMinutes) / 60) * HOUR_ROW_HEIGHT;

    return (
      <div
        key={event.id}
        className="absolute left-0 right-0 mx-1 px-2 py-1 text-xs rounded overflow-hidden shadow"
        style={{
          top: `${topPx}px`,
          height: `${heightPx}px`,
          backgroundColor: event.provider === 'google' ? '#4285F4' : '#0078D4',
          color: 'white',
          zIndex: 10,
        }}
        title={`${event.title} (${formatTime(start)} - ${formatTime(end)})`}
      >
        <div className="font-medium truncate">{event.title}</div>
        <div className="text-xs opacity-90 truncate">
          {formatTime(start)} - {formatTime(end)}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    if (loading) {
      return <div className="h-full flex items-center justify-center text-gray-400">Loading events...</div>;
    }
    if (error) {
      return <div className="h-full flex items-center justify-center text-red-400">{error}</div>;
    }
    const dayEvents = getEventsForDay(selectedDate);
    return (
      <div className="h-full relative">
        <div className="text-base font-semibold mb-2">
          {formatDate(selectedDate)}
        </div>
        <div className="h-[calc(100%-2rem)] overflow-y-auto relative">
          {/* Hour grid */}
          {hours.map((hour) => (
            <div key={hour} className="flex border-b border-gray-200 relative" style={{height: `${HOUR_ROW_HEIGHT}px`}}>
              <div className="w-12 p-1 text-xs text-gray-500">
                {hour.toString().padStart(2, '0')}:00
              </div>
              <div className="flex-1 p-1 min-h-[20px] relative" />
            </div>
          ))}
          {/* Events */}
          <div className="absolute" style={{left: TIME_COL_WIDTH, right: 0, top: 0, bottom: 0}}>
            {dayEvents.map(event => renderEventBlock(event, selectedDate))}
          </div>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    if (loading) {
      return <div className="h-full flex items-center justify-center text-gray-400">Loading events...</div>;
    }
    if (error) {
      return <div className="h-full flex items-center justify-center text-red-400">{error}</div>;
    }
    const weekDates = getWeekDates(selectedDate);
    return (
      <div className="h-full">
        <div className="grid grid-cols-8 gap-0 mb-1" style={{width: `calc(100% + ${TIME_COL_WIDTH}px)`}}>
          <div className="w-12" />
          {weekDates.map((date) => (
            <div key={date.toISOString()} className="text-center font-semibold text-xs">
              {formatHeader(date)}
            </div>
          ))}
        </div>
        <div className="h-[calc(100%-1.5rem)] overflow-y-auto relative">
          {/* Hour grid */}
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b border-gray-200" style={{height: `${HOUR_ROW_HEIGHT}px`}}>
              <div className="text-xs text-gray-500 p-1 text-right w-12">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {weekDates.map((date) => (
                <div key={date.toISOString()} className="p-1 min-h-[20px] border-l border-gray-200 relative" />
              ))}
            </div>
          ))}
          {/* Events */}
          <div className="absolute grid grid-cols-7" style={{left: TIME_COL_WIDTH, right: 0, top: 0, bottom: 0, pointerEvents: 'none'}}>
            {weekDates.map((date, idx) => (
              <div key={date.toISOString()} className="relative h-full" style={{pointerEvents: 'auto'}}>
                {getEventsForDay(date).map(event => renderEventBlock(event, date))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full">
      {viewMode === 'day' ? renderDayView() : renderWeekView()}
    </div>
  );
} 