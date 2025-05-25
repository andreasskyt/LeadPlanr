import { useState, useEffect } from 'react';
import { CalendarEvent, calendarService } from '@/lib/calendar-service';
import { CalendarAccount } from '@/lib/db';

export function useCalendarEvents(
  accounts: CalendarAccount[],
  selectedDate: Date,
  viewMode: 'day' | 'week'
) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchEvents = async () => {
      if (accounts.length === 0) {
        setEvents([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(selectedDate);
        if (viewMode === 'day') {
          endDate.setHours(23, 59, 59, 999);
        } else {
          // For week view, get events for the entire week
          endDate.setDate(endDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
        }

        const fetchedEvents = await calendarService.fetchEvents(accounts, startDate, endDate);
        
        if (isMounted) {
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
  }, [accounts, selectedDate, viewMode]);

  return { events, loading, error };
} 