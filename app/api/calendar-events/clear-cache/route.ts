import { NextResponse } from 'next/server';
import { calendarService } from '@/lib/calendar-service';

export async function GET() {
  try {
    calendarService.clearCache();
    return NextResponse.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST() {
  try {
    calendarService.clearCache();
    return NextResponse.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 