"use client";

import { useEffect } from "react";
import { getReadings } from "@/functions/charging";
import { getVehiclesChargings, updateVehicleCharging } from "@/actions/vehicles-chargings";
import { updateStationsSlots } from "@/actions/stations-slots";
import { toUrlSafeBase64 } from "@/lib/utils";
import Stores from "@/lib/stores";

const SessionMonitor = () => {
	const { user, isLoggedin } = Stores();

	useEffect(() => {
		if (!isLoggedin || !user?.id) return;

		const checkActiveSession = async () => {
			try {
				const activeSessionsRes = await getVehiclesChargings({
					search: `user:${user.id},status:active`,
					joins: "charging_slot:stations_slots"
				});

				if (activeSessionsRes.err || activeSessionsRes.count === 0) return;

				const session = activeSessionsRes.result[0];
				const slotId = (session.charging_slot as ChargingSlot).id;

				const readings = await getReadings(toUrlSafeBase64(slotId), String(user.id));
				
				if (readings.result?.energyStop !== undefined) {
					await updateVehicleCharging({
						id: session.id,
						body: { 
							status: "completed",
							final_reading: readings.result?.readings
						}
					});

					await updateStationsSlots({
						id: slotId,
						body: { active_connectors: [] }
					});
				}
			} catch (error) {
				console.error("Session monitor error:", error);
			}
		};

		const interval = setInterval(checkActiveSession, 10000);
		return () => clearInterval(interval);
	}, [user?.id, isLoggedin]);

	return null;
};

export default SessionMonitor;