import Api from "../apis/Api";

export const getStationsSlots = async ({ search = "", page = "", sort = "", nearby = {} } = {}) => {
	const options = {
		joins: `user:users, station:stations`,
	};
	if (search) options.search = search;
	if (page) options.page = page;
	if (sort) options.sort = sort;
	if (Object.keys(nearby).length) options.nearby = nearby;

	const res = await Api.get("/stations-slots", options);

	return res;
};

export const saveStationsSlots = async ({ body }) => {
	const res = await Api.post(`/stations-slots`, {
		body: body,
	});

	return res;
};

/**
 * Updates information for one or more stations' slots
 *
 * @async
 * @function updateStationsSlots
 * @param {Object} options - The options object
 * @param {string} [options.id] - The ID of the station-slot to update. If not provided, updates all stations-slots
 * @param {any} options.body - The data to update the station-slot(s) with
 * @returns {Promise<any>} The response from the API
 */
export const updateStationsSlots = async ({ id, body }) => {
	const endpoint = id ? `/stations-slots/${id}` : `/stations-slots`;
	const res = await Api.put(endpoint, {
		body: body,
	});

	return res;
};
