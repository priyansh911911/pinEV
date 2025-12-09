import Api from "../apis/Api";

export async function createStation({ body }) {
	try {
		const response = await Api.post("/stations", {
			body: body,
		});
		return response;
	} catch (error) {
		console.log(error);
	}
}

export async function getStations({ search = "", page = "", sort = "", nearby = {} } = {}) {
	try {
		const options = {};
		if (search) options.search = search;
		if (page) options.page = page;
		if (sort) options.sort = sort;
		if (Object.keys(nearby)) options.nearby = nearby;

		const response = await Api.get("/stations", options);
		return response;
	} catch (error) {
		console.log(error);
	}
}

export async function updateStation({ id, body }) {
	try {
		const response = await Api.put(`/stations/${id}`, {
			body: body,
		});
		return response;
	} catch (error) {
		console.log(error);
	}
}

export async function deleteStation({ id }) {
	try {
		const response = await Api.put(`/stations/${id}`, {
			body: { is_deleted: 1 },
		});
		return response;
	} catch (error) {
		console.log(error);
	}
}
