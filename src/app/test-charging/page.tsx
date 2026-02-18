"use client";

import { useState } from "react";
import { saveVehicleCharging } from "@/actions/vehicles-chargings";
import { stopActiveChargingSessions } from "@/functions/logout-handler";
import Stores from "@/lib/stores";

export default function TestChargingPage() {
	const { user } = Stores();
	const [loading, setLoading] = useState(false);

	const createTestSession = async () => {
		setLoading(true);
		try {
			await saveVehicleCharging({
				body: {
					user: user?.id,
					vehicle: 1,
					charging_slot: 1,
					status: "active",
					charge_txn_id: "test_" + Date.now(),
					initial_reading: 1000,
					started_at: new Date().toISOString(),
				}
			});
			alert("Test session created!");
		} catch (error) {
			console.error(error);
			alert("Failed to create test session");
		}
		setLoading(false);
	};

	const stopManual = async () => {
		setLoading(true);
		try {
			await stopActiveChargingSessions(String(user?.id), 'manual_stop');
			alert("Manual stop executed!");
		} catch (error) {
			console.error(error);
			alert("Failed");
		}
		setLoading(false);
	};

	const stopLogout = async () => {
		setLoading(true);
		try {
			await stopActiveChargingSessions(String(user?.id), 'logout');
			alert("Logout stop executed!");
		} catch (error) {
			console.error(error);
			alert("Failed");
		}
		setLoading(false);
	};

	return (
		<div className="p-8">
			<h1 className="text-2xl mb-4">Test Charging Stop</h1>
			<div className="space-y-4">
				<button 
					onClick={createTestSession} 
					disabled={loading}
					className="px-4 py-2 bg-green-500 text-white rounded block w-full"
				>
					Create Test Session
				</button>
				<button 
					onClick={stopManual} 
					disabled={loading}
					className="px-4 py-2 bg-orange-500 text-white rounded block w-full"
				>
					Test Manual Stop
				</button>
				<button 
					onClick={stopLogout} 
					disabled={loading}
					className="px-4 py-2 bg-red-500 text-white rounded block w-full"
				>
					Test Logout Stop
				</button>
			</div>
		</div>
	);
}
