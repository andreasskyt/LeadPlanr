'use client';

import { CalendarEvent } from '@/lib/calendar-service';
import React, { useState } from 'react';
import Link from 'next/link';

interface DayWeekViewProps {
  selectedDate: Date;
  viewMode: 'day' | 'week';
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  showOverlay?: boolean;
  hoveredEventId?: string | null;
  setHoveredEventId?: (id: string | null) => void;
  newAppointment: {
    startTime?: string;
    endTime?: string;
  };
  setNewAppointment: React.Dispatch<React.SetStateAction<{
    startTime?: string;
    endTime?: string;
  }>>;
}

const HOUR_ROW_HEIGHT = 32; // px
const TIME_COL_WIDTH = 48; // px

// Day color palette (Monday=0, Sunday=6)
export const DAY_COLORS = [
  '#22c55e', // Monday - green
  '#38bdf8', // Tuesday - light blue
  '#fbbf24', // Wednesday - yellow
  '#f472b6', // Thursday - pink
  '#a78bfa', // Friday - purple
  '#f87171', // Saturday - red
  '#60a5fa', // Sunday - blue
];

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

export default function DayWeekView({ selectedDate, viewMode, events, loading, error, showOverlay, hoveredEventId, setHoveredEventId, newAppointment, setNewAppointment }: DayWeekViewProps) {
  const [hoveredSlot, setHoveredSlot] = useState<{ day: string; hour: number; minute: number } | null>(null);
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

  // Render a single event block for a day
  const renderEventBlock = (event: CalendarEvent & { color?: string; borderColor?: string; textColor?: string }, day: Date, colorOverride?: string) => {
    const dayStart = getDayStart(day);
    const dayEnd = getDayEnd(day);
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);

    // Clamp event to the current day
    const start = eventStart < dayStart ? dayStart : eventStart;
    const end = eventEnd > dayEnd ? dayEnd : eventEnd;

    const startMinutes = (start.getHours() * 60) + start.getMinutes();
    const endMinutes = (end.getHours() * 60) + end.getMinutes();
    // For week view: position as percent of the day
    const topPercent = (startMinutes / 1440) * 100;
    let heightPercent = ((endMinutes - startMinutes) / 1440) * 100;
    const minHeightPx = 20;
    const minHeightPercent = (minHeightPx / (24 * HOUR_ROW_HEIGHT)) * 100;
    if (heightPercent < minHeightPercent) heightPercent = minHeightPercent;

    const isNewAppointment = event.id === 'new-appointment';
    const backgroundColor = isNewAppointment ? event.color : (event.color || colorOverride || (event.provider === 'google' ? '#4285F4' : '#0078D4'));
    const textColor = isNewAppointment ? event.textColor : 'white';
    const borderStyle = isNewAppointment ? `1px solid ${event.borderColor}` : 'none';

    return (
      <div
        key={event.id}
        className={`absolute left-0 right-2 mx-1 px-2 py-1 text-xs rounded overflow-hidden shadow transition-all duration-150 ${hoveredEventId === event.id ? 'ring-2 ring-blue-500 z-20 scale-[1.03]' : ''}`}
        style={{
          top: `${topPercent}%`,
          height: `${heightPercent}%`,
          minHeight: `${minHeightPx}px`,
          backgroundColor,
          color: textColor,
          border: borderStyle,
          zIndex: hoveredEventId === event.id ? 20 : 10,
        }}
        title={`${event.title} (${formatTime(start)} - ${formatTime(end)})`}
        onMouseEnter={() => setHoveredEventId && setHoveredEventId(event.id)}
        onMouseLeave={() => setHoveredEventId && setHoveredEventId(null)}
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
                <div className="border-t border-gray-200 relative" style={{height: `${HOUR_ROW_HEIGHT}px`}}>
                  {/* Events for this hour */}
                  {events.filter(event => {
                    const eventStart = new Date(event.start);
                    return (
                      eventStart.getHours() === hour &&
                      eventStart.getDate() === selectedDate.getDate() &&
                      eventStart.getMonth() === selectedDate.getMonth() &&
                      eventStart.getFullYear() === selectedDate.getFullYear()
                    );
                  }).map(event => renderEventBlock(event, selectedDate))}
                  {/* 15-minute slots only if no event starts in this hour */}
                  {events.every(event => {
                    const eventStart = new Date(event.start);
                    return eventStart.getHours() !== hour ||
                      eventStart.getDate() !== selectedDate.getDate() ||
                      eventStart.getMonth() !== selectedDate.getMonth() ||
                      eventStart.getFullYear() !== selectedDate.getFullYear();
                  }) && [0, 15, 30, 45].map(minute => (
                    <div
                      key={minute}
                      className="absolute inset-0 cursor-pointer hover:bg-gray-100 select-none"
                      style={{ top: `${(minute / 60) * 100}%`, height: '25%', zIndex: 30, pointerEvents: 'auto', right: 0, left: 'calc(100% - 8px)' }}
                      onClick={() => handleTimeSlotClick(selectedDate, hour, minute)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleTimeSlotClick(selectedDate, hour, minute);
                        }
                      }}
                    />
                  ))}
                </div>
              </React.Fragment>
            ))}
          </div>
          {/* Events */}
          <div className="absolute" style={{left: TIME_COL_WIDTH, right: 0, top: 0, bottom: 0}}>
            {events.map(event => renderEventBlock(event, selectedDate))}
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
      <div className="h-full relative">
        {/* Day headers */}
        <div className="grid gap-0 mb-1" style={{gridTemplateColumns: `48px repeat(7, 1fr)`}}>
          <div className="text-xs text-gray-500" />
          {weekDates.map((date) => (
            <div key={date.toISOString()} className="text-center font-semibold text-xs">
              {formatHeader(date)}
            </div>
          ))}
        </div>
        <div className="h-full overflow-y-auto relative">
          <div style={{ height: 24 * HOUR_ROW_HEIGHT, position: 'relative' }}>
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
            {/* Slot overlays: absolutely positioned, below events */}
            <div className="absolute grid" style={{gridTemplateColumns: `repeat(7, 1fr)`, left: TIME_COL_WIDTH, right: 0, top: 0, bottom: 0, pointerEvents: 'none', zIndex: 10, height: '100%'}}>
              {weekDates.map((date, idx) => {
                const eventsForThisDay = events.filter(event => {
                  const eventStart = new Date(event.start);
                  return (
                    eventStart.getDate() === date.getDate() &&
                    eventStart.getMonth() === date.getMonth() &&
                    eventStart.getFullYear() === date.getFullYear()
                  );
                });
                const dayKey = date.toISOString().split('T')[0];
                return (
                  <div key={date.toISOString()} className="relative h-full w-full" style={{pointerEvents: 'auto', position: 'relative', height: '100%'}}>
                    {/* Slot overlays */}
                    {hours.map(hour => (
                      [0, 15, 30, 45].map(minute => {
                        // Check if any event starts within this slot
                        const slotStart = new Date(date);
                        slotStart.setHours(hour, minute, 0, 0);
                        const hasEvent = eventsForThisDay.some(event => {
                          const eventStart = new Date(event.start);
                          return eventStart.getHours() === slotStart.getHours() &&
                            eventStart.getMinutes() === slotStart.getMinutes();
                        });
                        const isHovered = hoveredSlot && hoveredSlot.day === dayKey && hoveredSlot.hour === hour && hoveredSlot.minute === minute;
                        if (hasEvent) return null;
                        return (
                          <div
                            key={hour + '-' + minute}
                            className={`absolute cursor-pointer select-none focus:outline-none min-h-[8px] ${isHovered ? 'bg-gray-200' : ''}`}
                            style={{
                              top: `${hour * HOUR_ROW_HEIGHT + minute * (HOUR_ROW_HEIGHT / 60)}px`,
                              height: `${HOUR_ROW_HEIGHT / 4}px`,
                              left: 0,
                              right: 0,
                              zIndex: 10,
                              pointerEvents: 'auto',
                              userSelect: 'none',
                            }}
                            onMouseEnter={() => setHoveredSlot({ day: dayKey, hour, minute })}
                            onMouseLeave={() => setHoveredSlot(null)}
                            onClick={() => handleTimeSlotClick(date, hour, minute)}
                            role="button"
                            tabIndex={-1}
                            aria-label={`Create event at ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`}
                          />
                        );
                      })
                    ))}
                    {/* Event blocks */}
                    {eventsForThisDay.map(event => renderEventBlock(event, date, DAY_COLORS[idx]))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleTimeSlotClick = (day: Date, hour: number, minute: number) => {
    // Round to nearest 15 minutes
    const roundedMinute = Math.round(minute / 15) * 15;
    const newStart = new Date(day);
    newStart.setHours(hour, roundedMinute, 0, 0);

    // If we already have a start and end time, preserve the duration
    let newEnd: Date;
    if (newAppointment.startTime && newAppointment.endTime) {
      const currentStart = new Date(newAppointment.startTime);
      const currentEnd = new Date(newAppointment.endTime);
      const durationMs = currentEnd.getTime() - currentStart.getTime();
      newEnd = new Date(newStart.getTime() + durationMs);
    } else {
      // Default to 1 hour duration
      newEnd = new Date(newStart);
      newEnd.setHours(newStart.getHours() + 1);
    }

    setNewAppointment(prev => ({
      ...prev,
      startTime: newStart.toISOString(),
      endTime: newEnd.toISOString()
    }));
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