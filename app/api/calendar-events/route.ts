import { NextResponse } from 'next/server';
import { calendarAccounts } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const token = cookies().get('token')?.value;
    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const calendarId = searchParams.get('calendarId');

    if (!start || !end || !calendarId) {
      return new NextResponse('Missing required parameters', { status: 400 });
    }

    // Get the calendar account
    const account = await calendarAccounts.getByUserId(decoded.userId.toString());
    if (!account || account.length === 0) {
      return new NextResponse('No calendar account found', { status: 404 });
    }

    // Use the first account for now (we can add calendar selection later)
    const calendarAccount = account[0];

    let response;
    let provider;
    if (calendarAccount.provider.toLowerCase() === 'google') {
      provider = 'google';
      response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?` + new URLSearchParams({
          timeMin: start,
          timeMax: end,
          singleEvents: 'true',
          orderBy: 'startTime'
        }),
        {
          headers: {
            Authorization: `Bearer ${calendarAccount.access_token}`,
          },
        }
      );
    } else if (calendarAccount.provider.toLowerCase() === 'microsoft') {
      provider = 'microsoft';
      response = await fetch(
        `https://graph.microsoft.com/v1.0/me/calendars/${encodeURIComponent(calendarId)}/events?` + new URLSearchParams({
          $filter: `start/dateTime ge '${start}' and end/dateTime le '${end}'`,
          $orderby: 'start/dateTime',
          $select: 'id,subject,start,end,location,bodyPreview'
        }),
        {
          headers: {
            Authorization: `Bearer ${calendarAccount.access_token}`,
          },
        }
      );
    } else {
      return new NextResponse('Unsupported provider', { status: 400 });
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Calendar API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    // Transform to internal CalendarEvent format
    let events;
    if (provider === 'google') {
      events = data.items.map((event: any) => ({
        id: event.id,
        title: event.summary,
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        location: event.location,
        description: event.description,
        calendarId,
        provider: 'google',
      }));
    } else if (provider === 'microsoft') {
      events = data.value.map((event: any) => ({
        id: event.id,
        title: event.subject,
        start: event.start?.dateTime,
        end: event.end?.dateTime,
        location: event.location?.displayName,
        description: event.bodyPreview,
        calendarId,
        provider: 'microsoft',
      }));
    }
    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const token = cookies().get('token')?.value;
    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const data = await request.json();
    const { title, start, end, location, description, calendarId } = data;

    // Get the calendar account
    const account = await calendarAccounts.getByUserId(decoded.userId.toString());
    if (!account || account.length === 0) {
      return new NextResponse('No calendar account found', { status: 404 });
    }

    // Use the first account for now (we can add calendar selection later)
    const calendarAccount = account[0];

    let response;
    let provider;
    if (calendarAccount.provider.toLowerCase() === 'google') {
      provider = 'google';
      response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${calendarAccount.access_token}`,
          },
          body: JSON.stringify({
            summary: title,
            start: { dateTime: start },
            end: { dateTime: end },
            location,
            description,
          }),
        }
      );
    } else if (calendarAccount.provider.toLowerCase() === 'microsoft') {
      provider = 'microsoft';
      response = await fetch(
        `https://graph.microsoft.com/v1.0/me/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${calendarAccount.access_token}`,
          },
          body: JSON.stringify({
            subject: title,
            start: { dateTime: start, timeZone: 'UTC' },
            end: { dateTime: end, timeZone: 'UTC' },
            location: { displayName: location },
            body: { content: description, contentType: 'text' },
          }),
        }
      );
    } else {
      return new NextResponse('Unsupported provider', { status: 400 });
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Calendar API error: ${response.status} ${errorText}`);
    }

    const event = await response.json();
    // Transform to internal CalendarEvent format
    let calendarEvent;
    if (provider === 'google') {
      calendarEvent = {
        id: event.id,
        title: event.summary,
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        location: event.location,
        description: event.description,
        calendarId,
        provider: 'google',
      };
    } else if (provider === 'microsoft') {
      calendarEvent = {
        id: event.id,
        title: event.subject,
        start: event.start?.dateTime,
        end: event.end?.dateTime,
        location: event.location?.displayName,
        description: event.bodyPreview,
        calendarId,
        provider: 'microsoft',
      };
    }
    return NextResponse.json(calendarEvent);
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 