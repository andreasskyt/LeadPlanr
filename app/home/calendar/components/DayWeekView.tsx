'use client';

import { CalendarEvent } from '@/lib/calendar-service';

interface DayWeekViewProps {
  selectedDate: Date;
  viewMode: 'day' | 'week';
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
}

export default function DayWeekView({ selectedDate, viewMode, events, loading, error }: DayWeekViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const getWeekDates = (date: Date): Date[] => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    const monday = new Date(date.setDate(diff));
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

  const getEventsForTimeSlot = (date: Date, hour: number): CalendarEvent[] => {
    const slotStart = new Date(date);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(date);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    return events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return (
        (eventStart >= slotStart && eventStart < slotEnd) ||
        (eventEnd > slotStart && eventEnd <= slotEnd) ||
        (eventStart <= slotStart && eventEnd >= slotEnd)
      );
    });
  };

  const renderEvent = (event: CalendarEvent) => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60); // duration in minutes
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const top = (startMinutes / 60) * 100; // percentage from top
    const height = (duration / 60) * 100; // percentage of hour height

    return (
      <div
        key={event.id}
        className="absolute left-0 right-0 mx-1 px-2 py-1 text-xs rounded overflow-hidden"
        style={{
          top: `${top}%`,
          height: `${height}%`,
          backgroundColor: event.provider === 'google' ? '#4285F4' : '#0078D4',
          color: 'white',
          zIndex: 10,
        }}
        title={`${event.title} (${start.toLocaleTimeString()} - ${end.toLocaleTimeString()})`}
      >
        <div className="font-medium truncate">{event.title}</div>
        <div className="text-xs opacity-90 truncate">
          {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
          {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

    return (
      <div className="h-full">
        <div className="text-base font-semibold mb-2">
          {formatDate(selectedDate)}
        </div>
        <div className="h-[calc(100%-2rem)] overflow-y-auto">
          {hours.map((hour) => {
            const eventsInSlot = getEventsForTimeSlot(selectedDate, hour);
            return (
              <div key={hour} className="flex border-b border-gray-200 relative">
                <div className="w-12 p-1 text-xs text-gray-500">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="flex-1 p-1 min-h-[28px] relative">
                  {eventsInSlot.map(renderEvent)}
                </div>
              </div>
            );
          })}
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
        <div className="grid grid-cols-8 gap-0 mb-1">
          <div></div>
          {weekDates.map((date) => (
            <div key={date.toISOString()} className="text-center font-semibold text-xs">
              {formatHeader(date)}
            </div>
          ))}
        </div>
        <div className="h-[calc(100%-1.5rem)] overflow-y-auto">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b border-gray-200">
              <div className="text-xs text-gray-500 p-1 text-right w-12">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {weekDates.map((date) => {
                const eventsInSlot = getEventsForTimeSlot(date, hour);
                return (
                  <div key={date.toISOString()} className="p-1 min-h-[28px] border-l border-gray-200 relative">
                    {eventsInSlot.map(renderEvent)}
                  </div>
                );
              })}
            </div>
          ))}
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