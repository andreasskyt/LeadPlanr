'use client';

import { useState, useEffect } from 'react';
import MonthView from './components/MonthView';
import DayWeekView from '@/app/home/calendar/components/DayWeekView';
import MapView from './components/MapView';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { CalendarAccount } from '@/lib/db';
import { CalendarEvent } from '@/lib/calendar-service';

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
  const [accounts, setAccounts] = useState<CalendarAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationMap, setLocationMap] = useState<Record<string, { lat: number; long: number }>>({});
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await fetch('/api/calendar-accounts');
        if (!response.ok) throw new Error('Failed to fetch calendar accounts');
        const data = await response.json();
        setAccounts(data);
      } catch (error) {
        console.error('Error fetching calendar accounts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  const { events, loading: eventsLoading, error: eventsError } = useCalendarEvents(
    accounts,
    selectedDate,
    viewMode
  );

  // Fetch lat/long for all unique event locations
  useEffect(() => {
    const uniqueLocations = Array.from(new Set(events.map(e => e.location).filter(Boolean)));
    if (uniqueLocations.length === 0) {
      setLocationMap({});
      return;
    }
    let cancelled = false;
    fetch('/api/resolve-locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locations: uniqueLocations }),
    })
      .then(res => res.json())
      .then(data => {
        if (!cancelled) setLocationMap(data);
      })
      .catch(() => {
        if (!cancelled) setLocationMap({});
      });
    return () => { cancelled = true; };
  }, [events]);

  // Merge lat/long into events
  type LocatedEvent = CalendarEvent & { lat: number; long: number; dayIndex: number; dayOfWeekIdx: number };

  const eventsWithLocation: LocatedEvent[] = events.map(e =>
    e.location && locationMap[e.location]
      ? { ...e, lat: locationMap[e.location].lat, long: locationMap[e.location].long, dayIndex: 0, dayOfWeekIdx: 0 }
      : { ...e, dayIndex: 0, dayOfWeekIdx: 0 }
  ) as LocatedEvent[];

  // Helper: group events with locations by day and assign index
  type EventsByDay = Record<string, LocatedEvent[]>;

  function getIndexedEventsByDay(events: LocatedEvent[]): EventsByDay {
    const byDay: EventsByDay = {};
    events.forEach((e) => {
      if (!e.location || !e.lat || !e.long) return;
      const dayKey = new Date(e.start).toISOString().split('T')[0];
      if (!byDay[dayKey]) byDay[dayKey] = [];
      byDay[dayKey].push(e);
    });
    // Sort and assign index, and set dayOfWeekIdx (Monday=0, Sunday=6)
    Object.entries(byDay).forEach(([dayKey, dayEvents]) => {
      dayEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
      const dayOfWeekIdx = (new Date(dayKey).getDay() + 6) % 7;
      dayEvents.forEach((e, i) => {
        (e as any).dayIndex = i + 1;
        (e as any).dayOfWeekIdx = dayOfWeekIdx;
      });
    });
    return byDay;
  }

  const indexedEventsByDay = getIndexedEventsByDay(eventsWithLocation);

  // Flatten for MapView
  const indexedEvents: LocatedEvent[] = Object.values(indexedEventsByDay).flat();

  // Helper for local day comparison
  function isSameLocalDay(a: Date, b: Date) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  // Filter for map: if day view, only show that day's events; if week, show all
  let mapEvents = indexedEvents;
  if (viewMode === 'day') {
    mapEvents = indexedEvents.filter(e => isSameLocalDay(new Date(e.start), selectedDate));
  }

  // Always rebuild mapEventsByDay from mapEvents (no extra filtering)
  function getEventsByDay(events: LocatedEvent[]): Record<string, LocatedEvent[]> {
    const byDay: Record<string, LocatedEvent[]> = {};
    events.forEach(e => {
      if (!e.location || !e.lat || !e.long) return;
      const dayKey = new Date(e.start).toISOString().split('T')[0];
      if (!byDay[dayKey]) byDay[dayKey] = [];
      byDay[dayKey].push(e);
    });
    return byDay;
  }
  const mapEventsByDay = getEventsByDay(mapEvents);

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      {/* Top section with month view and day/week view */}
      <div className="flex gap-4 h-[33vh] min-h-[200px]">
        {/* Left side - Month View */}
        <div className="w-[320px] bg-white rounded-lg shadow p-2">
          <MonthView
            selectedDate={selectedDate}
            onDateSelect={(date) => {
              setSelectedDate(date);
              setViewMode('day');
            }}
            onWeekSelect={(date) => {
              setSelectedDate(date);
              setViewMode('week');
            }}
            viewMode={viewMode}
          />
        </div>

        {/* Right side - Day/Week View */}
        <div className="flex-1 bg-white rounded-lg shadow p-4">
          <DayWeekView
            selectedDate={selectedDate}
            viewMode={viewMode}
            events={events}
            loading={eventsLoading}
            error={eventsError}
            showOverlay={accounts.length === 0}
            hoveredEventId={hoveredEventId}
            setHoveredEventId={setHoveredEventId}
          />
        </div>
      </div>

      {/* Bottom section with appointment card and map */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left side - New Appointment Card */}
        <div className="w-[320px] bg-white rounded-lg shadow p-2">
          <div className="p-2">
            <h3 className="text-lg font-semibold mb-4">Create New Appointment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter appointment title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedDate.toISOString().split('T')[0]}
                  readOnly
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Map View */}
        <div className="flex-1 bg-white rounded-lg shadow p-4">
          <MapView events={mapEvents} eventsByDay={mapEventsByDay} loading={eventsLoading} hoveredEventId={hoveredEventId} setHoveredEventId={setHoveredEventId} />
        </div>
      </div>
    </div>
  );
} 