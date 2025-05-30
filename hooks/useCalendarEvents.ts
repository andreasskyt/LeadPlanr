import { useState, useEffect } from 'react';
import { CalendarEvent, calendarService } from '@/lib/calendar-service';
import { CalendarAccount } from '@/lib/db';

function getWeekRange(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  // Monday as first day of week
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

export function useCalendarEvents(
  accounts: CalendarAccount[],
  selectedDate: Date,
  viewMode: 'day' | 'week',
  selectedCalendar: { id: string; provider: string } | null,
  refreshKey?: number
) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchEvents = async () => {
      if (accounts.length === 0 || !selectedCalendar) {
        setEvents([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Always fetch for the week containing the selected date
        const { start, end } = getWeekRange(selectedDate);
        const fetchedEvents = await calendarService.fetchEvents(accounts, [selectedCalendar], start, end);
        if (isMounted) {
          // Debug log
          // console.log('selectedCalendar:', selectedCalendar);
          // console.log('Fetched events:', fetchedEvents.map(e => ({ id: e.id, calendarId: e.calendarId, title: e.title })));
          setEvents(fetchedEvents);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch calendar events');
          setLoading(false);
        }
      }
    };

    fetchEvents();

    return () => {
      isMounted = false;
    };
  }, [accounts, selectedDate, viewMode, selectedCalendar, refreshKey]);

  return { events, loading, error };
} 