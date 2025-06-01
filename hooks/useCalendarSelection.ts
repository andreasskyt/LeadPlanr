import { useState, useEffect } from 'react';
import { CalendarAccount } from '@/lib/db';
import { Calendar, calendarService } from '@/lib/calendar-service';

export function useCalendarSelection(accounts: CalendarAccount[]) {
  const [availableCalendars, setAvailableCalendars] = useState<Calendar[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchCalendars = async () => {
      if (accounts.length === 0) {
        setAvailableCalendars([]);
        setSelectedCalendarId(null);
        setLoading(true);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const allCalendars: Calendar[] = [];
        for (const account of accounts) {
          try {
            const calendars = await calendarService.fetchCalendars(account);
            allCalendars.push(...calendars);
          } catch (error) {
            console.error(`Error fetching calendars for ${account.provider} account:`, error);
            if (error instanceof Error && error.message.includes('401')) {
              try {
                const refreshedAccount = await calendarService.refreshToken(account);
                if (refreshedAccount) {
                  const calendars = await calendarService.fetchCalendars(refreshedAccount);
                  allCalendars.push(...calendars);
                }
              } catch (refreshError) {
                console.error(`Failed to refresh token for ${account.provider} account:`, refreshError);
              }
            }
          }
        }

        if (isMounted) {
          setAvailableCalendars(allCalendars);
          // Select the primary calendar by default
          const primaryCalendar = allCalendars.find(cal => cal.primary);
          setSelectedCalendarId(primaryCalendar?.id || allCalendars[0]?.id || null);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch calendars');
          setLoading(false);
        }
      }
    };

    fetchCalendars();

    return () => {
      isMounted = false;
    };
  }, [accounts]);

  return {
    availableCalendars,
    selectedCalendarId,
    setSelectedCalendarId,
    loading,
    error,
  };
} 