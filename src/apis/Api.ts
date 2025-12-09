/* eslint-disable prefer-const */
import axios, { AxiosRequestConfig } from "axios";
import tokens from "./tokens.json";

interface Tokens {
	[key: string]: string | false;
}

// Base64 encoding characters
const base64chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function toBase64(num: number): string {
	let result = "";
	const str = num.toString();
	for (let i = 0; i < str.length; i++) {
		const charCode = parseInt(str[i]);
		result += base64chars[charCode % 64];
	}
	return result;
}

export const _DATABASE = process.env.NEXT_PUBLIC_DATABASE;
export const _BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const local_host = process.env.NEXT_PUBLIC_LOCAL_SERVER;

type HttpMethod = "get" | "post" | "put" | "delete" | "sql";

type RequestOptions = {
	loading?: boolean;
	body?: {
		sql: "string";
		params: [{ [key: string]: string | number }];
	} | { [key: string]: any };
	key?: Record<string, string | any>;
	page?: Record<string, string | number>;
	sort?: Record<string, string | number>;
	joins?: Record<string, string | number>;
	filter?: Record<string, string | number>;
	search?: Record<string, string | number>;
	nearby?: Record<string, string | number>;
	hidden?: Record<string, string | number>;
	fields?: Record<string, string | number>;
	session?: Record<string, string | number>;
	validation?: Record<string, string | number>;
	permissions?: Record<string, string | number>;
};

function uniqueKey(input: string) {
	let code = input.charCodeAt(0);
	for (let i = 0; i < input.length; i++) {
		const char = input.charCodeAt(i);
		code = (code << 5) - code + char;
		code &= code;
	}

	return toBase64(Math.abs(code)).substring(0, 8);
}

function getKey(method: HttpMethod, url: string, options: RequestOptions) {
	if (!local_host) throw new Error("local_host is not defined");
	const _url = local_host + url;
	const parsed_url = new URL(_url);
	// const pathname = parsed_url.pathname;
	const pathname = "/" + parsed_url.pathname.split("/")[1];

	const request: any = {
		fields: options?.fields,
		hidden: options?.hidden,
		filter: options?.filter,
		nearby: options?.nearby ? Object.keys(options.nearby).join() : "",
		collections: options?.joins,
		permissions: options?.permissions,
		validation: options?.validation,
	};

	request["body_is_array"] = Array.isArray(options.body || {});

	let tokenStr = pathname;
	for (let key in request) {
		if (request[key]) {
			tokenStr += key + ":" + request[key];
		}
	}
	const key = method + ":" + pathname + ">" + uniqueKey(tokenStr);
	return key;
}

const makeRequest = async (method: HttpMethod, endpoint: string, options: RequestOptions = {}): Promise<any> => {
	const {
		body,
		page,
		sort,
		joins,
		hidden,
		fields,
		filter,
		search,
		nearby,
		session,
		validation,
		permissions,
		loading = true,
	} = options;

	const headers: any = {};

	if (hidden) headers.hidden = hidden;
	if (filter) headers.filter = filter;
	if (fields) headers.fields = fields;
	if (session) headers.session = session;
	if (nearby) headers.nearby = Object.keys(nearby).join();
	if (joins) headers.collections = joins;
	if (validation) headers.validation = validation;
	if (permissions) headers.permissions = permissions;

	const key = getKey(method, endpoint, options);
	const token = (tokens as Tokens)[key] || false;

	if (!token) {
		headers["key"] = key;
	} else {
		headers.token = token;
	}

	const params: any = {
		page: page,
		sort: sort,
		search: search,
	};

	if (nearby) {
		params.nearby = Object.values(nearby).join();
	}

	try {
		if (loading) {
			// console.log("Loading started...");
		}

		const axiosInstance = axios.create({
			baseURL: token ? _BASE_URL : local_host,
			headers: { app: _DATABASE },
		});

		const requestConfig: AxiosRequestConfig = {
			method,
			params,
			headers,
			data: body,
			url: endpoint,
		};

		const response = await axiosInstance(requestConfig);
		return response.data;
	} catch (error: any) {
		console.error(`${method.toUpperCase()} Error:`, error.message);
		throw error;
	} finally {
		if (loading) {
			// console.log("Loading completed.");
		}
	}
};

const Api = {
	get: async (endpoint: string, options?: RequestOptions): Promise<any> => makeRequest("get", endpoint, options),
	put: async (endpoint: string, options?: RequestOptions): Promise<any> => makeRequest("put", endpoint, options),
	post: async (endpoint: string, options?: RequestOptions): Promise<any> => makeRequest("post", endpoint, options),
	delete: async (endpoint: string, options?: RequestOptions): Promise<any> => makeRequest("delete", endpoint, options),
	sql: async (endpoint: string, options?: RequestOptions): Promise<any> =>
		makeRequest("post", `/sql-${endpoint.replace("/", "")}`, options),
};

export default Api;
