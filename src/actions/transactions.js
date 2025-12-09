import Api from "../apis/Api";

export const getTransactions = async ({ search = "", page = "1,1000", sort = "-created_at" }) => {
	try {
		const response = await Api.get("/transactions", {
			search: search,
			page: page,
			sort: sort || "-created_at",
			joins: "station:stations,user:users",
		});
		return response;
	} catch (error) {
		console.log(error);
	}
};

export const saveTransaction = async ({ body }) => {
	try {
		const response = await Api.post("/transactions", {
			body: body,
		});
		return response;
	} catch (error) {
		console.log(error);
	}
};

export const updateTransaction = async ({ id, body }) => {
	try {
		const response = await Api.put(`/transactions/${id}`, {
			body: body,
		});
		return response;
	} catch (error) {
		console.log(error);
	}
};
