"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { stopActiveChargingSessions } from "@/functions/logout-handler";
import { saveVehicleCharging } from "@/actions/vehicles-chargings";
import Stores from "@/lib/stores";

export default function TestLogout() {
  const { user } = Stores();

  const createTestSession = async () => {
    if (!user?.id) return;
    const testSession = {
      user: user.id,
      vehicle: 1,
      station: 1,
      charging_slot: 1,
      duration_in_minute: 60,
      amount_paid: 0,
      status: "active",
      started_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      charge_txn_id: "test_" + Date.now(),
      initial_reading: 1000
    };
    
    const result = await saveVehicleCharging({ body: testSession });
    console.log("Test session created:", result);
    alert(result.err ? "Failed to create session" : "Test session created!");
  };

  const testStopCharging = async () => {
    if (!user?.id) return;
    console.log("Testing stop charging...");
    const result = await stopActiveChargingSessions(String(user.id));
    console.log("Stop result:", result);
    alert(result ? "Charging stopped!" : "Failed to stop charging");
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user?.id) {
        navigator.sendBeacon('/api/stop-charging', JSON.stringify({ userId: String(user.id) }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user?.id]);

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Test Logout Handler</h1>
      <div className="space-y-4">
        <Button onClick={createTestSession} variant="outline">
          Create Test Charging Session
        </Button>
        <Button onClick={testStopCharging}>
          Test Stop Charging
        </Button>
        <p>Close this tab/browser to test automatic stop</p>
      </div>
    </div>
  );
}