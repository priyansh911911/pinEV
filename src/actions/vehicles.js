import Api from "../apis/Api";

export async function getVehicles({ search = "", page = "", sort = "" } = {}) {
	try {
		const response = await Api.get("/vehicles", {
			search: search,
			page: page,
			sort: sort || "-created_at",
			filter: "is_deleted:0",
		});
		return response;
	} catch (error) {
		console.log(error);
	}
}

export async function createVehicle({ body }) {
	try {
		const response = await Api.post("/vehicles", {
			body: body,
		});
		return response;
	} catch (error) {
		console.log(error);
	}
}

export async function updateVehicle({ id, body }) {
	try {
		const response = await Api.put(`/vehicles/${id}`, {
			body: body,
		});
		return response;
	} catch (error) {
		console.log(error);
	}
}

export async function deleteVehicle({ id }) {
	try {
		const response = await Api.put(`/vehicles/${id}`, {
			body: { is_deleted: 1 },
		});
		return response;
	} catch (error) {
		console.log(error);
	}
}
