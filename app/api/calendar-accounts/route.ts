import { NextResponse } from 'next/server';
import { calendarAccounts } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const token = cookies().get('token')?.value;
    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const accounts = await calendarAccounts.getByUserId(decoded.userId.toString());
    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error fetching calendar accounts:', error);
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
    const account = await calendarAccounts.create({
      ...data,
      user_id: decoded.userId.toString(),
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error('Error creating calendar account:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 