import { NextRequest, NextResponse } from 'next/server';
import { stopActiveChargingSessions } from '@/functions/logout-handler';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('API: Stopping charging sessions for user:', userId);
    const result = await stopActiveChargingSessions(userId);
    
    return NextResponse.json({ 
      success: result,
      message: result ? 'Charging sessions stopped and transactions created' : 'Failed to stop some sessions'
    });
  } catch (error) {
    console.error('Error in stop-charging API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}