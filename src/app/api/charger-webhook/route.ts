import { NextRequest, NextResponse } from 'next/server';
import { getVehiclesChargings, updateVehicleCharging } from '@/actions/vehicles-chargings';
import { updateStationsSlots } from '@/actions/stations-slots';
import { format } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, status, connectorId, transactionId, faultCode } = body;

    // Handle charger disconnection/fault events
    if (status === 'Faulted' || status === 'Unavailable' || faultCode) {
      await handleChargerFault(deviceId, connectorId, faultCode || status, transactionId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}

async function handleChargerFault(deviceId: string, connectorId: number, reason: string, transactionId?: string) {
  try {
    // Find active session for this device/connector
    const activeSessionsRes = await getVehiclesChargings({
      search: `status:active`,
      joins: 'charging_slot:stations_slots,station:stations'
    });

    if (activeSessionsRes.err || activeSessionsRes.count === 0) return;

    const session = activeSessionsRes.result.find((s: any) => 
      s.charging_slot?.id === deviceId && 
      (s.charging_slot?.active_connectors || []).includes(connectorId)
    );

    if (!session) return;

    const now = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    const initialEnergy = Number(session.initial_reading) || 0;
    const currentEnergy = Number(session.final_reading?.energy) || initialEnergy;
    const energyDelivered = Math.max(0, (currentEnergy - initialEnergy) / 1000);
    const station = session.station as any;
    const finalAmount = Math.round(energyDelivered * Number(station.price_per_kwh || 0) * Number(station.tax || 1) * 100) / 100;

    // Complete the session
    await updateVehicleCharging({
      id: session.id,
      body: {
        status: 'completed',
        stopped_at: now,
        final_amount: finalAmount,
        completion_reason: `charger_fault_${reason}`
      }
    });

    // Free up the connector
    const slot = session.charging_slot as any;
    await updateStationsSlots({
      id: slot.id,
      body: {
        active_connectors: (slot.active_connectors || []).filter((c: number) => c !== connectorId)
      }
    });

    console.log(`Auto-completed session ${session.id} due to charger fault: ${reason}`);
  } catch (error) {
    console.error('Failed to handle charger fault:', error);
  }
}