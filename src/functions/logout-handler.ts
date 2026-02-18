import { getVehiclesChargings, updateVehicleCharging } from "@/actions/vehicles-chargings";
import { getStationsSlots, updateStationsSlots } from "@/actions/stations-slots";
import { saveTransaction } from "@/actions/transactions";
import { toggleCharging } from "@/functions/charging";
import { toUrlSafeBase64 } from "@/lib/utils";
import { format } from "date-fns";

/**
 * Stops all active charging sessions for a user when they log out
 * @param userId - The ID of the user logging out
 * @param reason - Reason for stopping (logout, manual_stop)
 * @returns Promise<boolean> - Returns true if all sessions were stopped successfully
 */
export const stopActiveChargingSessions = async (userId: string, reason: string = 'unknown'): Promise<boolean> => {
	try {
		console.log(`[${reason.toUpperCase()}] Stopping active charging sessions for user:`, userId);

		// Get all active charging sessions for the user
		const activeSessionsRes = await getVehiclesChargings({
			search: `user:${userId},status:active`,
			joins: "charging_slot:stations_slots,station:stations,vehicle:vehicles"
		});

		console.log('Active sessions response:', activeSessionsRes);

		if (activeSessionsRes.err || activeSessionsRes.count === 0) {
			console.log('No active sessions found or error fetching');
			return true;
		}

		const activeSessions = activeSessionsRes.result;
		console.log('Found active sessions:', activeSessions.length);

		const stopPromises = activeSessions.map(async (session: VehicleCharging) => {
			try {
				const station = session.station as AdminStation;
				const slotId = (session.charging_slot as ChargingSlot).id;
				const transactionDate = new Date();
				const formattedDate = format(transactionDate, "yyyy-MM-dd HH:mm:ss");

				// Get current slot status to find active connector
				const slotStatusRes = await getStationsSlots({ search: `id:${slotId}` });

				if (slotStatusRes.err || slotStatusRes.count === 0) {
					console.error(`Failed to get slot status for session ${session.id}`);
					return false;
				}

				const slot: StationSlot = slotStatusRes.result[0];
				const connectorId = (slot.active_connectors || [])?.[0] || 1; // Use connector 1 as fallback for test sessions

				if (!connectorId) {
					console.error(`No active connector found for session ${session.id}`);
					return false;
				}

				console.log(`[${reason.toUpperCase()}] Stopping session ${session.id} with connector ${connectorId}`);

				// Stop the charging session
				const stopChargeRes = await toggleCharging({
					type: "stop",
					deviceId: toUrlSafeBase64(slotId),
					transactionId: session.charge_txn_id || "",
					connectorId: String(connectorId),
					idTag: String(userId),
				});

				console.log(`[${reason.toUpperCase()}] Stop charge response for session ${session.id}:`, stopChargeRes);

				// Skip API call validation for test sessions (txn_id starts with 'test_')
				if (session.charge_txn_id?.startsWith('test_')) {
					console.log(`Skipping API call for test session ${session.id}`);
				} else if (stopChargeRes.err || stopChargeRes.result?.status !== "Accepted") {
					console.error(`Failed to stop charging for session ${session.id}`);
					return false;
				}

				// Update slot to remove active connector
				await updateStationsSlots({
					id: slotId,
					body: {
						active_connectors: (slot.active_connectors || []).filter(connector => connector !== connectorId),
					},
				});

				// Calculate final cost based on current readings
				const readings = stopChargeRes.result?.readings || session.final_reading || {};
				const initialEnergy = Number(session.initial_reading) || 0;
				const currentEnergy = Number(readings?.energy) || 0;
				const energyDelivered = Math.max(0, (currentEnergy - initialEnergy) / 1000); // Convert Wh to kWh, ensure non-negative
				const pricePerKWH = Number(station?.price_per_kwh || 0);
				const tax = Number(station.tax) || 1;
				const currentCostWithoutTax = energyDelivered * pricePerKWH;
				const currentCostWithTax = currentCostWithoutTax * tax;
				const finalAmount = Math.round(currentCostWithTax * 100) / 100;

				console.log(`Session ${session.id} calculation:`, {
					initialEnergy,
					currentEnergy,
					energyDelivered,
					pricePerKWH,
					tax,
					currentCostWithoutTax,
					currentCostWithTax,
					finalAmount
				});

				// Update session status to completed
				await updateVehicleCharging({
					id: session.id,
					body: {
						status: "completed",
						stopped_at: formattedDate,
						final_amount: finalAmount,
						final_reading: readings,
					},
				});

				// Create wallet transaction for audit trail
				try {
					// Get user's current wallet balance from the most recent transaction
					const { getTransactions } = await import("@/actions/transactions");
					const recentTransactionRes = await getTransactions({
						search: `user:${userId}`,
						page: "1,1",
						sort: "-created_at"
					});

					let currentBalance = 0;
					if (!recentTransactionRes.err && recentTransactionRes.count > 0) {
						currentBalance = Number(recentTransactionRes.result[0].total_balance) || 0;
					}

					// Only deduct money if there's an actual charge
					const newBalance = finalAmount > 0 ? currentBalance - finalAmount : currentBalance;

					const walletBody = {
						user: userId,
						amount: finalAmount,
						total_balance: newBalance,
						date: formattedDate,
						description: finalAmount > 0 ? "Charge payment" : "Charging session (no consumption)",
						type: "debit",
					};

					await saveTransaction({ body: walletBody });
					console.log(`[${reason.toUpperCase()}] Created wallet transaction for session ${session.id}, amount: ${finalAmount}`);
				} catch (walletError) {
					console.error(`Failed to create wallet transaction for session ${session.id}:`, walletError);
				}

				return true;
			} catch (error) {
				console.error(`Error stopping session ${session.id}:`, error);
				return false;
			}
		});

		const results = await Promise.all(stopPromises);
		const allStopped = results.every(result => result === true);

		if (!allStopped) {
			console.warn("Some charging sessions could not be stopped during logout");
		}

		return allStopped;
	} catch (error) {
		console.error("Error stopping active charging sessions:", error);
		return false;
	}
};