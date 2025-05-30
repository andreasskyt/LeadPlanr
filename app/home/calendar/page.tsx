'use client';

import { useState, useEffect } from 'react';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import MonthView from './components/MonthView';
import DayWeekView from './components/DayWeekView';
import MapView from './components/MapView';
import NewAppointmentView from './components/NewAppointmentView';
import { useCalendar } from '@/contexts/CalendarContext';
import { CalendarEvent } from '@/lib/calendar-service';
import { useSearchParams } from 'next/navigation';

export default function CalendarPage() {
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
  const { selectedCalendarId, setSelectedCalendarId, accounts, availableCalendars } = useCalendar();
  const selectedCalendar = availableCalendars.find(cal => cal.id === selectedCalendarId) || null;
  const { events, loading: eventsLoading, error: eventsError } = useCalendarEvents(accounts, selectedDate, viewMode, selectedCalendar);

  // Handle calendar selection from URL parameter
  useEffect(() => {
    const calendarId = searchParams.get('calendar');
    if (calendarId && availableCalendars.length > 0) {
      // Only set if the calendar exists in available calendars
      const calendarExists = availableCalendars.some(cal => cal.id === calendarId);
      if (calendarExists) {
        setSelectedCalendarId(calendarId);
      }
    }
  }, [searchParams, availableCalendars, setSelectedCalendarId]);

  // State for new appointment
  const [title, setTitle] = useState(searchParams.get('title') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [newAppointmentDate, setNewAppointmentDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // State for location resolution
  const [locationMap, setLocationMap] = useState<Record<string, { lat: number; long: number }>>({});
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);

  // Debounce location changes
  const [debouncedLocation, setDebouncedLocation] = useState(location);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedLocation(location), 500);
    return () => clearTimeout(timer);
  }, [location]);

  // Fetch lat/long for all unique event locations
  useEffect(() => {
    const uniqueLocations = Array.from(new Set([
      ...events.map(e => e.location).filter(Boolean),
      debouncedLocation
    ].filter(Boolean)));
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
  }, [events, debouncedLocation]);

  // Merge lat/long into events
  type LocatedEvent = typeof events[number] & { lat?: number; long?: number; dayIndex?: number; dayOfWeekIdx?: number };
  const eventsWithLocation: LocatedEvent[] = events.map(e =>
    e.location && locationMap[e.location]
      ? { ...e, lat: locationMap[e.location].lat, long: locationMap[e.location].long, dayIndex: 0, dayOfWeekIdx: 0 }
      : { ...e, dayIndex: 0, dayOfWeekIdx: 0 }
  );

  // Group events with locations by day and assign index
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

  // Prepare the events array for DayWeekView, including the new appointment if valid
  const isNewEventValid = !!(title && location && newAppointmentDate && startTime && endTime);
  let eventsForCalendar = events;
  if (isNewEventValid) {
    // Compose ISO start/end from date and time
    const startISO = new Date(`${newAppointmentDate}T${startTime}`).toISOString();
    const endISO = new Date(`${newAppointmentDate}T${endTime}`).toISOString();
    const newEvent = {
      id: 'new-appointment',
      title,
      location,
      start: startISO,
      end: endISO,
      calendarId: 'new',
      provider: 'google' as const, // fallback to match CalendarEvent type
      color: '#6b7280', // medium grey background (gray-500)
      borderColor: '#000000', // black border
      textColor: '#ffffff', // white text
    };
    eventsForCalendar = [...events, newEvent];
  }

  // Compute new appointment marker info if location is resolved
  const newAppointmentMarkerInfo = (location && locationMap[location])
    ? {
        lat: locationMap[location].lat,
        long: locationMap[location].long,
        location,
        title,
        startTime,
        endTime,
        date: newAppointmentDate,
        color: '#6b7280', // medium grey background (gray-500)
      }
    : null;

  // Add new appointment marker to mapEvents if valid and resolved
  let mapEventsWithNew = mapEvents;
  if (isNewEventValid && newAppointmentMarkerInfo) {
    // Find the correct day key for the new appointment
    const newEventDateObj = new Date(`${newAppointmentDate}T${startTime}`);
    const newEventDayKey = newEventDateObj.toISOString().split('T')[0];
    // Split mapEvents into before, same day, and after
    const before: LocatedEvent[] = [];
    const sameDay: LocatedEvent[] = [];
    const after: LocatedEvent[] = [];
    mapEvents.forEach(e => {
      const eventDayKey = new Date(e.start).toISOString().split('T')[0];
      if (eventDayKey < newEventDayKey) before.push(e);
      else if (eventDayKey > newEventDayKey) after.push(e);
      else sameDay.push(e);
    });
    // Insert the new appointment in order among sameDay events
    const dayOfWeekIdx = (newEventDateObj.getDay() + 6) % 7; // Monday=0, Sunday=6
    const newEventObj = {
      ...newAppointmentMarkerInfo,
      id: 'new-appointment',
      title,
      start: new Date(`${newAppointmentDate}T${startTime}`).toISOString(),
      end: new Date(`${newAppointmentDate}T${endTime}`).toISOString(),
      calendarId: 'new',
      provider: 'google' as const,
      dayIndex: 0,
      dayOfWeekIdx,
      color: '#6b7280', // medium grey background (gray-500)
    };
    const sameDayWithNew = [...sameDay, newEventObj].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    mapEventsWithNew = [...before, ...sameDayWithNew, ...after];
  }

  // Always rebuild mapEventsByDay from mapEventsWithNew (not just mapEvents)
  function getEventsByDay(events: LocatedEvent[]): Record<string, LocatedEvent[]> {
    const byDay: Record<string, LocatedEvent[]> = {};
    events.forEach(e => {
      if (
        !e.location ||
        typeof e.lat !== 'number' ||
        typeof e.long !== 'number' ||
        typeof e.dayIndex !== 'number' ||
        typeof e.dayOfWeekIdx !== 'number'
      ) return;
      const dayKey = new Date(e.start).toISOString().split('T')[0];
      if (!byDay[dayKey]) byDay[dayKey] = [];
      byDay[dayKey].push(e);
    });
    return byDay;
  }
  // For MapView, filter to only events with all required fields and cast to the required type
  const mapEventsByDay = Object.fromEntries(
    Object.entries(getEventsByDay(mapEventsWithNew)).map(([day, events]) => [
      day,
      events
        .filter(
          (e): e is LocatedEvent & { lat: number; long: number; dayIndex: number; dayOfWeekIdx: number } =>
            typeof e.lat === 'number' &&
            typeof e.long === 'number' &&
            typeof e.dayIndex === 'number' &&
            typeof e.dayOfWeekIdx === 'number'
        )
        .map(e => e as CalendarEvent & { lat: number; long: number; dayIndex: number; dayOfWeekIdx: number }),
    ])
  ) as unknown as Record<string, (CalendarEvent & { lat: number; long: number; dayIndex: number; dayOfWeekIdx: number })[]>;

  // Layout: left column (MonthView, NewAppointmentView), right column (DayWeekView, MapView)
  return (
    <div className="flex flex-col h-full p-4 gap-4">
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
            events={eventsForCalendar}
            selectedDate={selectedDate}
            viewMode={viewMode}
            loading={eventsLoading}
            error={eventsError}
            showOverlay={accounts.length === 0}
            hoveredEventId={hoveredEventId}
            setHoveredEventId={setHoveredEventId}
          />
        </div>
      </div>
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left side - New Appointment Card */}
        <div className="w-[320px] bg-white rounded-lg shadow p-2">
          <NewAppointmentView
            selectedDate={newAppointmentDate}
            setSelectedDate={setNewAppointmentDate}
            location={location}
            setLocation={setLocation}
            title={title}
            setTitle={setTitle}
            startTime={startTime}
            setStartTime={setStartTime}
            endTime={endTime}
            setEndTime={setEndTime}
            isLocationResolved={location ? !!locationMap[location] : undefined}
          />
        </div>
        {/* Right side - Map View */}
        <div className="flex-1 bg-white rounded-lg shadow p-4">
          <MapView
            events={mapEventsWithNew}
            eventsByDay={mapEventsByDay}
            loading={eventsLoading}
            hoveredEventId={hoveredEventId}
            setHoveredEventId={setHoveredEventId}
            newAppointmentMarker={newAppointmentMarkerInfo}
          />
        </div>
      </div>
    </div>
  );
} 