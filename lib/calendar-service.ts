import { CalendarAccount } from './db';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO string
  end: string;   // ISO string
  location?: string;
  description?: string;
  calendarId: string;
  provider: 'google' | 'microsoft';
}

export interface Calendar {
  id: string;
  name: string;
  provider: 'google' | 'microsoft';
  primary?: boolean;
}

class CalendarService {
  private cache: Map<string, { events: CalendarEvent[]; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private convertToISOString(date: string | { dateTime: string; timeZone?: string } | { date: string }): string {
    if (typeof date === 'string') {
      return date;
    }
    if ('dateTime' in date) {
      return date.dateTime;
    } else {
      // All-day event: treat as midnight UTC
      return date.date + 'T00:00:00Z';
    }
  }

  async fetchEvents(
    accounts: CalendarAccount[],
    calendars: { id: string; provider: string }[],
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    const cacheKey = `${startDate.toISOString()}-${endDate.toISOString()}-${calendars.map(c => c.id).join(',')}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.events;
    }

    const allEvents: CalendarEvent[] = [];

    for (const account of accounts) {
      const matchingCalendars = calendars.filter(
        c => c.provider.toLowerCase() === account.provider.toLowerCase()
      );
      for (const calendar of matchingCalendars) {
        try {
          const events = await this.fetchEventsForAccount(account, calendar.id, startDate, endDate);
          allEvents.push(...events);
        } catch (error) {
          if (error instanceof Error && error.message.includes('401')) {
            try {
              const refreshedAccount = await this.refreshToken(account);
              if (refreshedAccount) {
                const events = await this.fetchEventsForAccount(refreshedAccount, calendar.id, startDate, endDate);
                allEvents.push(...events);
              }
            } catch (refreshError) {
              console.error('Failed to refresh token for account:', refreshError);
            }
          }
        }
      }
    }

    allEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    this.cache.set(cacheKey, {
      events: allEvents,
      timestamp: Date.now(),
    });

    return allEvents;
  }

  async refreshToken(account: CalendarAccount): Promise<CalendarAccount | null> {
    try {
      const response = await fetch('/api/calendar-accounts/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId: account.id }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to refresh token: ${response.status} ${errorText}`);
      }

      const refreshedAccount = await response.json();
      
      // Update the account in memory with the new tokens
      account.access_token = refreshedAccount.access_token;
      account.refresh_token = refreshedAccount.refresh_token;
      account.valid_from = refreshedAccount.valid_from;
      account.valid_to = refreshedAccount.valid_to;
      
      return account;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }

  private async fetchEventsForAccount(
    account: CalendarAccount,
    calendarId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    if (account.provider.toLowerCase() === 'google') {
      return this.fetchGoogleEvents(account, calendarId, startDate, endDate);
    } else if (account.provider.toLowerCase() === 'microsoft') {
      return this.fetchMicrosoftEvents(account, calendarId, startDate, endDate);
    }
    return [];
  }

  private async fetchGoogleEvents(
    account: CalendarAccount,
    calendarId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?` +
      `timeMin=${startDate.toISOString()}&timeMax=${endDate.toISOString()}&singleEvents=true&timeZone=${timeZone}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${account.access_token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Calendar API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.items.map((item: any) => {
      const start = this.convertToISOString(item.start);
      const end = this.convertToISOString(item.end);
      return {
        id: item.id,
        title: item.summary,
        start,
        end,
        location: item.location,
        description: item.description,
        calendarId: calendarId,
        provider: 'google' as const,
      };
    });
  }

  private async fetchMicrosoftEvents(
    account: CalendarAccount,
    calendarId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/calendars/${encodeURIComponent(calendarId)}/calendarView?` +
      `startDateTime=${startDate.toISOString()}&endDateTime=${endDate.toISOString()}&timeZone=${timeZone}`,
      {
        headers: {
          Authorization: `Bearer ${account.access_token}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Microsoft Calendar API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.value.map((item: any) => {
      const start = this.convertToISOString(item.start);
      const end = this.convertToISOString(item.end);
      return {
        id: item.id,
        title: item.subject,
        start,
        end,
        location: item.location?.displayName,
        description: item.bodyPreview,
        calendarId: calendarId,
        provider: 'microsoft' as const,
      };
    });
  }

  async fetchCalendars(account: CalendarAccount): Promise<Calendar[]> {
    if (account.provider.toLowerCase() === 'google') {
      return this.fetchGoogleCalendars(account);
    } else if (account.provider.toLowerCase() === 'microsoft') {
      return this.fetchMicrosoftCalendars(account);
    }
    return [];
  }

  private async fetchGoogleCalendars(account: CalendarAccount): Promise<Calendar[]> {
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      {
        headers: {
          Authorization: `Bearer ${account.access_token}`,
        },
      }
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Google Calendar API error: ${response.status} ${JSON.stringify(data)}`);
    }
    return (data.items || []).map((item: any) => ({
      id: item.id,
      name: item.summary,
      provider: 'google' as const,
      primary: !!item.primary,
    }));
  }

  private async fetchMicrosoftCalendars(account: CalendarAccount): Promise<Calendar[]> {
    const response = await fetch(
      'https://graph.microsoft.com/v1.0/me/calendars',
      {
        headers: {
          Authorization: `Bearer ${account.access_token}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Microsoft Calendar API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.value.map((item: any) => ({
      id: item.id,
      name: item.name,
      provider: 'microsoft' as const,
      primary: item.isDefaultCalendar || false,
    }));
  }

  clearCache() {
    this.cache.clear();
  }
}

export const calendarService = new CalendarService(); 