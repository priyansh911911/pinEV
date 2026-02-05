import Api from "../apis/Api";

export async function loginUser(props) {
	const { body } = props ?? {};

	const res = await Api.post(`/auth-users`, {
		fields: "id,name,password,email,role",
		body: {
			id: body?.id || "",
			email: body?.email || "",
		},
	});

	return res;
}

export async function getUsers(props) {
	const { search, page, sort } = props || {};

	try {
		const response = await Api.get("/users", {
			search: search,
			page: page,
			sort: sort || "-created_at",
			filter: "is_active:1",
		});
		return response;
	} catch (error) {
		console.log(error);
	}
}

export async function saveUser(props) {
	const { body } = props || {};

	try {
		const response = await Api.post("/users", {
			body: body,
		});
		return response;
	} catch (error) {
		console.log(error);
	}
}

export async function updateUser(props) {
	const { body } = props || {};

	try {
		const response = await Api.post("/users", {
			body: body,
		});
		return response;
	} catch (error) {
		console.log(error);
	}
}

export async function getUserById(id) {
	try {
		const response = await Api.get(`/users/${id}`);
		return response;
	} catch (error) {
		console.log(error);
	}
}
