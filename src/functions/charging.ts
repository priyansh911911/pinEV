import { getStationsSlots } from "@/actions/stations-slots";

export const API_URL = "https://api.pinev.net";

enum CHARGING_COMMAND {
	START = "RemoteStartTransaction",
	STOP = "RemoteStopTransaction",
	READING = "RemoteMeterValue",
}

type ToggleChargingParams = {
	deviceId: string;
	transactionId: string;
	connectorId: string;
	idTag: string;
	type: "start" | "stop";
};

export const getUnusedConnectorId = (slot: StationSlot) => {
	const usedConnectors = new Set(slot.active_connectors);
	for (let i = 1; i <= slot.no_of_connector; i++) {
		if (!usedConnectors.has(i)) {
			return i;
		}
	}
	return null;
};

export const getSlotStatus = async (deviceId: string) => {
	const response = await getStationsSlots({ search: `id:${deviceId}` });

	return response;
};

export const toggleCharging = async ({ deviceId, transactionId, connectorId, idTag, type }: ToggleChargingParams) => {
	const command = type === "start" ? CHARGING_COMMAND.START : CHARGING_COMMAND.STOP;

	const payload = type === "start" ? { idTag, connectorId } : { idTag, connectorId, transactionId };

	const response = await fetch(API_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			deviceId,
			command,
			payload,
		}),
	});

	if (!response.ok) {
		throw new Error(`Failed to ${type} charging`);
	}

	return response.json();
};

export const getReadings = async (deviceId: string, idTag: string) => {
	const response = await fetch(API_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			deviceId,
			command: CHARGING_COMMAND.READING,
			payload: {
				connectorId: 1,
				idTag: idTag,
			},
		}),
	});

	if (!response.ok) {
		throw new Error("Failed to fetch readings");
	}

	const data = await response.json();

	// Check for fault status in response
	if (data.status === 'Faulted' || data.status === 'Unavailable' || data.errorCode) {
		throw new Error(`Charger fault: ${data.status || data.errorCode}`);
	}

	return data;
};
