import { NextResponse } from 'next/server';
import { calendarAccounts } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Verify the account belongs to the user
    const accounts = await calendarAccounts.getByUserId(session.user.id);
    const account = accounts.find(a => a.id === params.id);
    
    if (!account) {
      return new NextResponse('Not Found', { status: 404 });
    }

    await calendarAccounts.delete(params.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting calendar account:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 