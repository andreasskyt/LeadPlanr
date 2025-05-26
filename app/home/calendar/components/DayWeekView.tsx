'use client';

import { CalendarEvent } from '@/lib/calendar-service';
import React from 'react';
import Link from 'next/link';

interface DayWeekViewProps {
  selectedDate: Date;
  viewMode: 'day' | 'week';
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  showOverlay?: boolean;
}

const HOUR_ROW_HEIGHT = 32; // px
const TIME_COL_WIDTH = 48; // px

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

// Inline SVG for location icon
function LocationIcon({ className = '', size = 14 }: { className?: string; size?: number }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 2C6.686 2 4 4.686 4 8c0 4.418 5.25 9.54 5.47 9.75a1 1 0 0 0 1.06 0C10.75 17.54 16 12.418 16 8c0-3.314-2.686-6-6-6zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"
        fill="#fff"
        stroke="#fff"
        strokeWidth="0.5"
      />
      <circle cx="10" cy="8" r="2" fill="#2563eb" />
    </svg>
  );
}

export default function DayWeekView({ selectedDate, viewMode, events, loading, error, showOverlay }: DayWeekViewProps) {
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
    let heightPx = ((endMinutes - startMinutes) / 60) * HOUR_ROW_HEIGHT;
    const minHeightPx = 20;
    if (heightPx < minHeightPx) heightPx = minHeightPx;

    return (
      <div
        key={event.id}
        className="absolute left-0 right-0 mx-1 px-2 py-1 text-xs rounded overflow-hidden shadow"
        style={{
          top: `${topPx}px`,
          height: `${heightPx}px`,
          minHeight: `${minHeightPx}px`,
          backgroundColor: event.provider === 'google' ? '#4285F4' : '#0078D4',
          color: 'white',
          zIndex: 10,
        }}
        title={`${event.title} (${formatTime(start)} - ${formatTime(end)})`}
      >
        <div className="font-medium truncate flex items-center gap-1">
          {event.title}
          {event.location && (
            <span className="flex items-center ml-1" title={event.location}>
              <LocationIcon size={12} className="inline-block align-middle" />
            </span>
          )}
        </div>
        <div className="text-xs opacity-90 truncate">
          {formatTime(start)} - {formatTime(end)}
        </div>
        {event.location && (
          <div className="text-xs opacity-80 truncate flex items-center gap-1 mt-0.5">
            <LocationIcon size={11} className="inline-block align-middle" />
            <span>{event.location}</span>
          </div>
        )}
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
          <div className="grid gap-0" style={{gridTemplateColumns: `48px 1fr`}}>
            {hours.map((hour) => (
              <React.Fragment key={hour}>
                <div
                  className="text-xs text-gray-500 pt-1 pr-1 text-right border-t border-gray-200"
                  style={{height: `${HOUR_ROW_HEIGHT}px`, lineHeight: '16px'}}
                >
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="border-t border-gray-200 relative" style={{height: `${HOUR_ROW_HEIGHT}px`}} />
              </React.Fragment>
            ))}
          </div>
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
        <div className="grid gap-0 mb-1" style={{gridTemplateColumns: `48px repeat(7, 1fr)`}}>
          <div className="text-xs text-gray-500" />
          {weekDates.map((date) => (
            <div key={date.toISOString()} className="text-center font-semibold text-xs">
              {formatHeader(date)}
            </div>
          ))}
        </div>
        <div className="h-[calc(100%-1.5rem)] overflow-y-auto relative">
          {/* Hour grid */}
          <div className="grid" style={{gridTemplateColumns: `48px repeat(7, 1fr)`}}>
            {hours.map((hour) => (
              <React.Fragment key={hour}>
                <div
                  className="text-xs text-gray-500 pt-1 pr-1 text-right border-t border-gray-200"
                  style={{height: `${HOUR_ROW_HEIGHT}px`, lineHeight: '16px'}}
                >
                  {hour.toString().padStart(2, '0')}:00
                </div>
                {weekDates.map((date, idx) => (
                  <div key={date.toISOString() + hour}
                    className={idx === 0 ? 'border-t border-gray-200 border-l border-gray-200 relative' : 'border-t border-gray-200 border-l border-gray-200 relative'}
                    style={{height: `${HOUR_ROW_HEIGHT}px`}}
                  />
                ))}
              </React.Fragment>
            ))}
          </div>
          {/* Events */}
          <div className="absolute grid" style={{gridTemplateColumns: `repeat(7, 1fr)`, left: TIME_COL_WIDTH, right: 0, top: 0, bottom: 0, pointerEvents: 'none'}}>
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
    <div className="h-full relative">
      {viewMode === 'day' ? renderDayView() : renderWeekView()}
      {showOverlay && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-700 mb-2">No calendar available.</div>
            <div className="text-gray-500">
              Go to{' '}
              <Link href="/home/settings" className="text-blue-600 underline hover:text-blue-800">Settings</Link>
              {' '}to give access to your calendar.
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 