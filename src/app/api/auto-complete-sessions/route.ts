import { NextResponse } from 'next/server';
import { getVehiclesChargings, updateVehicleCharging } from '@/actions/vehicles-chargings';
import { getStationsSlots, updateStationsSlots } from '@/actions/stations-slots';
import { getReadings } from '@/functions/charging';
import { toUrlSafeBase64 } from '@/lib/utils';
import { format } from 'date-fns';

export async function POST() {
  try {
    const activeSessionsRes = await getVehiclesChargings({
      search: 'status:active',
      joins: 'charging_slot:stations_slots,station:stations,vehicle:vehicles'
    });

    if (activeSessionsRes.err || activeSessionsRes.count === 0) {
      return NextResponse.json({ message: 'No active sessions', completed: 0 });
    }

    let completedCount = 0;
    const activeSessions = activeSessionsRes.result;

    for (const session of activeSessions) {
      if (session.charge_txn_id?.startsWith('test_')) continue;

      const shouldComplete = await checkSessionForCompletion(session);
      if (shouldComplete.complete) {
        await completeFailedSession(session, shouldComplete.reason);
        completedCount++;
      }
    }

    return NextResponse.json({ 
      message: `Auto-completed ${completedCount} sessions`,
      completed: completedCount 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

async function checkSessionForCompletion(session: VehicleCharging) {
  const slot = session.charging_slot as ChargingSlot;
  const deviceId = toUrlSafeBase64(slot.id);
  const sessionStartTime = new Date(session.started_at).getTime();
  const now = Date.now();
  const sessionDuration = now - sessionStartTime;
  
  // Check 1: Communication timeout (existing logic)
  try {
    const readings = await Promise.race([
      getReadings(deviceId, String(session.user)),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
    ]);
    
    // Check 2: No power consumption for extended period
    if (readings && typeof readings === 'object' && 'energy' in readings) {
      const currentEnergy = Number(readings.energy) || 0;
      const initialEnergy = Number(session.initial_reading) || 0;
      const energyDiff = currentEnergy - initialEnergy;
      
      // If no energy consumed for more than 10 minutes, likely disconnected
      if (sessionDuration > 10 * 60 * 1000 && energyDiff <= 0.1) {
        return { complete: true, reason: 'no_power_consumption' };
      }
      
      // Check 3: Very long session without significant progress (>4 hours)
      if (sessionDuration > 4 * 60 * 60 * 1000 && energyDiff < 5) {
        return { complete: true, reason: 'session_timeout' };
      }
    }
    
    return { complete: false, reason: null };
  } catch (error) {
    // Communication failed - complete the session
    return { complete: true, reason: 'communication_failure' };
  }
}

async function completeFailedSession(session: VehicleCharging, reason: string) {
  const station = session.station as AdminStation;
  const slot = session.charging_slot as ChargingSlot;
  const now = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  
  // Try to get final reading one more time
  let currentEnergy = Number(session.initial_reading) || 0;
  try {
    const deviceId = toUrlSafeBase64(slot.id);
    const finalReading = await Promise.race([
      getReadings(deviceId, String(session.user)),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
    ]);
    if (finalReading && typeof finalReading === 'object' && 'energy' in finalReading) {
      currentEnergy = Number(finalReading.energy) || currentEnergy;
    }
  } catch (error) {
    // Use last known reading or initial reading
    currentEnergy = Number(session.final_reading?.energy) || currentEnergy;
  }
  
  const initialEnergy = Number(session.initial_reading) || 0;
  const energyDelivered = Math.max(0, (currentEnergy - initialEnergy) / 1000);
  const finalAmount = Math.round(energyDelivered * Number(station.price_per_kwh || 0) * Number(station.tax || 1) * 100) / 100;

  await updateVehicleCharging({
    id: session.id,
    body: {
      status: 'completed',
      stopped_at: now,
      final_amount: finalAmount,
      completion_reason: reason
    }
  });

  await updateStationsSlots({
    id: slot.id,
    body: {
      active_connectors: (slot.active_connectors || []).filter(c => c !== (slot.active_connectors?.[0] || 1))
    }
  });
}