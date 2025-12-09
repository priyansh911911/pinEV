declare type StoreContextType = {
	[key: PropertyKey]: unknown;
};

declare type SelectOptions = {
	isOnlyDrawer?: boolean;
	isOnlySelect?: boolean;
	isDrawerFullwidth?: boolean;
};

declare type FormFieldComponent =
	| "input"
	| "textarea"
	| "checkbox"
	| "datePicker"
	| "select"
	| "skeleton"
	| "button"
	| "hidden"
	| "file";

declare type FormFieldType =
	| "text"
	| "number"
	| "tel"
	| "email"
	| "select"
	| "date"
	| "password"
	| "file"
	| "submit"
	| "button"
	| "skeleton";

declare type ValidationTypeProps =
	| "string"
	| "number"
	| "email"
	| "url"
	| "uuid"
	| "bigint"
	| "boolean"
	| "trim"
	| "toLowerCase"
	| "toUpperCase"
	| "date"
	| "symbol"
	| "array"
	| "object"
	| "undefined"
	| "null"
	| "void"
	| "any"
	| "unknown"
	| "never"
	| "custom";

declare type validationProps = {
	type: { value: ValidationTypeProps; message?: string };
	min?: { value: number; message?: string };
	max?: { value: number; message?: string };
	optional?: boolean;
	custom?: string;
};

type Connector = "type1" | "type2" | "type3";

declare type Station = {
	id: string;
	name: string;
	rating: number;
	distance: number;
	pricePerUnit: number;
	connectors: Connector[];
	lat_lng: { lat: number; lng: number };
	active: boolean;
	address: string;
};

declare type DateEvent = {
	date: Date;
	title: string;
};

declare type TimeSlot = {
	id: string;
	time: string;
	available: boolean;
};

declare type Duration = {
	id: string;
	time: string;
};

declare type ChargingSlot2 = {
	id: string;
	name: string;
	time_for_full_charge: string;
	durations: Duration[];
};

declare type StationStatus = "pending" | "approved" | "rejected" | "blocked" | "inactive";

declare type AdminStation = {
	id: string;
	name: string;
	address: string;
	phone: string;
	email: string;
	status: StationStatus;
	code: string;
	details: {
		phone: string;
		email: string;
		manager: string;
		start_time: string;
		end_time: string;
	};
	latitude: number;
	longitude: number;
	price_per_kwh: number;
	price_per_minute: number;
	tax: number;
};

declare type SignupDetails = {
	name: string;
	email: string;
	phone: string;
};

declare type LoginDetails = {
	id: string;
	email: string;
	phone: string;
	password: string;
	is_active: boolean;
	otp: string;
};

declare type LatLong = {
	latitude: number;
	longitude: number;
};
type Address = {
	short_address: string;
	formatted_address: string;
	pin_code: string;
	state: string;
	district: string;
	mandal: string;
};

type StationWithNearby = {
	nearby: number;
	slots: ChargingSlot[];
} & AdminStation;
type StationSlotWithNearby = {
	nearby: number;
} & StationSlot;

interface Schedule {
	id: string;
	days: string[];
	start_time: string;
	end_time: string;
}

interface ChargingSlot {
	id: string;
	name: string;
	power: string;
	connector_type: string;
	status: "active" | "inactive";
	schedules: Schedule[];
	price_per_minute: number;
	no_of_connector: number;
	active_connectors: number[];
}
