import { NextResponse } from 'next/server';
import { calendarAccounts } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const accounts = await calendarAccounts.getByUserId(session.user.id);
    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error fetching calendar accounts:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const data = await request.json();
    const account = await calendarAccounts.create({
      ...data,
      user_id: session.user.id,
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error('Error creating calendar account:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 