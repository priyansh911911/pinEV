"use client";

import { convertToAddress, getPosition } from "@/functions/address";
import Stores from "@/lib/stores";
import { FC, useEffect } from "react";

interface GetLocationProps {}

const GetLocation: FC<GetLocationProps> = ({}) => {
	const { latLong, isLocating, setIsLocating, setLatLong, setAddress, setPostalCode } = Stores();

	useEffect(() => {
		if (isLocating) {
			setTimeout(() => {
				setIsLocating(false);
			}, 7000);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		getPosition(setIsLocating, setLatLong);
	}, [setIsLocating, setLatLong]);

	useEffect(() => {
		if (!latLong) return;
		setIsLocating(false);
	}, [latLong, setIsLocating]);

	// TODO: with a google api key
	// useEffect(() => {
	// 	if (latLong) {
	// 		convertToAddress(latLong, setIsLocating, setPostalCode, setAddress);
	// 	}
	// }, [latLong, setIsLocating, setLatLong, setPostalCode, setAddress]);

	return null;
};

export default GetLocation;
