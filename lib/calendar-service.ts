import { CalendarAccount } from './db';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
  calendarId: string;
  provider: 'google' | 'microsoft';
}

class CalendarService {
  private cache: Map<string, { events: CalendarEvent[]; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async fetchEvents(
    accounts: CalendarAccount[],
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    const cacheKey = `${startDate.toISOString()}-${endDate.toISOString()}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.events;
    }

    const allEvents: CalendarEvent[] = [];

    for (const account of accounts) {
      try {
        const events = await this.fetchEventsForAccount(account, startDate, endDate);
        allEvents.push(...events);
      } catch (error) {
        console.error(`Error fetching events for ${account.provider} account:`, error);
        // If token is invalid, try to refresh it
        if (error instanceof Error && error.message.includes('401')) {
          try {
            const refreshedAccount = await this.refreshToken(account);
            if (refreshedAccount) {
              const events = await this.fetchEventsForAccount(refreshedAccount, startDate, endDate);
              allEvents.push(...events);
            }
          } catch (refreshError) {
            console.error(`Failed to refresh token for ${account.provider} account:`, refreshError);
          }
        }
      }
    }

    // Sort events by start time
    allEvents.sort((a, b) => a.start.getTime() - b.start.getTime());

    // Update cache
    this.cache.set(cacheKey, {
      events: allEvents,
      timestamp: Date.now(),
    });

    return allEvents;
  }

  private async refreshToken(account: CalendarAccount): Promise<CalendarAccount | null> {
    try {
      const response = await fetch('/api/calendar-accounts/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId: account.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const refreshedAccount = await response.json();
      return refreshedAccount;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }

  private async fetchEventsForAccount(
    account: CalendarAccount,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    if (account.provider.toLowerCase() === 'google') {
      return this.fetchGoogleEvents(account, startDate, endDate);
    } else if (account.provider.toLowerCase() === 'microsoft') {
      return this.fetchMicrosoftEvents(account, startDate, endDate);
    }
    return [];
  }

  private async fetchGoogleEvents(
    account: CalendarAccount,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${startDate.toISOString()}&timeMax=${endDate.toISOString()}&singleEvents=true`,
      {
        headers: {
          Authorization: `Bearer ${account.access_token}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Calendar API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.items.map((item: any) => ({
      id: item.id,
      title: item.summary,
      start: new Date(item.start.dateTime || item.start.date),
      end: new Date(item.end.dateTime || item.end.date),
      location: item.location,
      description: item.description,
      calendarId: account.id.toString(),
      provider: 'google' as const,
    }));
  }

  private async fetchMicrosoftEvents(
    account: CalendarAccount,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/calendarView?` +
      `startDateTime=${startDate.toISOString()}&endDateTime=${endDate.toISOString()}`,
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
      title: item.subject,
      start: new Date(item.start.dateTime),
      end: new Date(item.end.dateTime),
      location: item.location?.displayName,
      description: item.bodyPreview,
      calendarId: account.id.toString(),
      provider: 'microsoft' as const,
    }));
  }

  clearCache() {
    this.cache.clear();
  }
}

export const calendarService = new CalendarService(); 