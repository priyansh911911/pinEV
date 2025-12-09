import Api from "../apis/Api";

export const saveBooking = async ({ body }) => {
	const res = await Api.post("/bookings", {
		body: body,
	});

	return res;
};

export const getBookings = async ({ search = "", page = "", sort = "" } = {}) => {
	const options = {};

	if (search) options.search = search;
	if (page) options.page = page;
	if (sort) options.sort = sort;

	console.log(options);

	const res = await Api.get("/bookings", {
		...options,
		joins: "user:users, vehicle:vehicles, payment:transactions, station:stations",
	});

	return res;
};

export const updateBooking = async ({ id, body }) => {
	const res = await Api.put(`/bookings/${id}`, {
		body: body,
	});

	return res;
};
