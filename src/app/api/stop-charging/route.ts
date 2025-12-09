import { NextRequest, NextResponse } from 'next/server';
import { stopActiveChargingSessions } from '@/functions/logout-handler';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const result = await stopActiveChargingSessions(userId);
    
    return NextResponse.json({ 
      success: result,
      message: result ? 'Charging sessions stopped' : 'Failed to stop some sessions'
    });
  } catch (error) {
    console.error('Error in stop-charging API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}