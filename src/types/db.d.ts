declare type User = {
	id: number;
	name: string;
	phone: string;
	email: string;
	image: string;
	password: string;
	details: {
		[key: string]: string;
	};
	role: string;
	permissions: {
		[key: string]: boolean;
	};
	is_active: boolean;
	last_login: Date;
	created_at: Date;
	updated_at: Date;
};

declare type Wallet = {
	id: number;
	user: number;
	amount: number;
	total_balance: number;
	date: Date;
	type: "credit" | "debit";
	description: string;
	created_at: Date;
	updated_at: Date;
};

declare type Vehicle = {
	id: number;
	user: number;
	vehicle_number: string;
	vehicle_type: string;
	brand: string;
	model: string;
	color: string;
	year_of_manufacture: number;
	battery_capacity: number; // in kWh
	range_per_charge: number; // in km
	registration_date: Date;
	last_service_date: Date | null;
	is_deleted: boolean;
	image?: string;
	details?: {
		[key: string]: string;
	};
	created_at: Date;
	updated_at: Date;
};

declare type Transaction = {
	id: number;
	user: string;
	amount: number;
	total_balance: number;
	date: Date;
	type: "credit" | "debit";
	description: string;
	created_at: Date;
	updated_at: Date;
};

declare type Booking = {
	id: number;
	station: Station;
	vehicle: Vehicle;
	payment: Transaction;
	datetime: Date;
	status: "upcoming" | "active" | "completed" | "cancelled";
	duration_in_minute: number;
	created_at: Date;
	updated_at: Date;
};

declare type StationSlot = {
	station: AdminStation;
	user: User;
} & ChargingSlot;

declare type VehicleCharging = {
	id: number;
	datetime: Date;
	amount_paid: number;
	user: number | User;
	vehicle: number | Vehicle;
	station: number | AdminStation;
	charging_slot: number | StationSlot;
	transaction: number | Transaction;
	status: "scheduled" | "active" | "completed" | "cancelled";
	duration_in_minute: number;
	started_at: Date | null;
	stopped_at: Date | null;
	final_amount: number;
	power_consumed: number; // in kWh
	charge_txn_id: string | null;
	initial_reading: number | null;
	final_reading: Record<string, any> | null;
	last_updated_at: String | null;
	created_at: Date;
	updated_at: Date;
};
