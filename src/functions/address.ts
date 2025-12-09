export const getPosition = async (setIsLocating: (value: boolean) => void, setLatLong: (value: LatLong) => void) => {
	setIsLocating(true);
	await window.navigator.geolocation.getCurrentPosition(coords => success(coords, setLatLong));
};

export const success = async (coordinates: any, setLatLong: (value: LatLong) => void) => {
	let coords = {
		latitude: coordinates?.coords?.latitude ?? 26.2006,
		longitude: coordinates?.coords?.longitude ?? 92.9376,
	};
	setLatLong(coords);
};

export async function convertToAddress(
	coords: LatLong,
	setIsLocating: (value: boolean) => void,
	setPostalCode: (value: string) => void,
	setAddress: (value: Address) => void
) {
	if (coords) {
		try {
			const url = `https://api.olamaps.io/places/v1/reverse-geocode?latlng=${coords.latitude},${coords.longitude}&api_key=${process.env.NEXT_PUBLIC_OLAMAPS_API_KEY}`;

			const response = await fetch(url, { method: "GET" });
			const data = await response.json();

			const properties = data?.results[0];

			const pin_code = properties?.address_components.find((item: any) => item.types.includes("postal_code")).long_name;
			const state = properties?.address_components.find((item: any) =>
				item.types.includes("administrative_area_level_1")
			).long_name;
			const district = properties?.address_components.find((item: any) =>
				item.types.includes("administrative_area_level_2")
			).long_name;
			const mandal = properties?.address_components.find((item: any) => item.types.includes("sublocality")).long_name;

			setAddress({
				short_address: properties?.name,
				formatted_address: properties?.formatted_address,
				pin_code,
				state,
				district,
				mandal,
			});
			setPostalCode(pin_code);

			setIsLocating(false);
			// return res;
		} catch (e) {
			setIsLocating(false);
		}
	}
}
