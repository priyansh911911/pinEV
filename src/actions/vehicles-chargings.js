import Api from "../apis/Api";

export async function getVehiclesChargings({ search = "", page = "", sort = "", joins = "" } = {}) {
	const options = {
		sort: sort || "-created_at",
	};

	if (search) options.search = search;
	if (page) options.page = page;
	if (sort) options.sort = sort;
	if (joins) options.joins = joins;

	try {
		const response = await Api.get("/vehicles-chargings", options);
		return response;
	} catch (error) {
		console.log(error);
	}
}

export async function saveVehicleCharging({ body }) {
	try {
		const response = await Api.post("/vehicles-chargings", {
			body: body,
		});
		return response;
	} catch (error) {
		console.log(error);
	}
}

export async function updateVehicleCharging({ id, body }) {
	try {
		const response = await Api.put(`/vehicles-chargings/${id}`, {
			body: body,
		});
		return response;
	} catch (error) {
		console.log(error);
	}
}

export async function deleteVehicleCharging({ id }) {
	try {
		const response = await Api.put(`/vehicles-chargings/${id}`, {
			body: { is_deleted: 1 },
		});
		return response;
	} catch (error) {
		console.log(error);
	}
}
