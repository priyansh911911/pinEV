"use client";

import FlatList from "@/components/flat-list";
import { STATIONS } from "@/lib/defaults";
import { FC, useCallback, useEffect, useState } from "react";
import StationCard from "../station-card";
import Stores from "@/lib/stores";
import { getStations } from "@/actions/stations";
import { toast } from "sonner";

interface NearByStationsProps {
	stations: StationWithNearby[];
}

const NearByStations: FC<NearByStationsProps> = ({ stations }) => {
	return (
		// <FlatList
		// 	data={stations}
		// 	keyExtractor={station => station.id}
		// 	renderItem={station => <StationCard station={station} />}
		// />

		<>
			{stations.map(station => (
				<StationCard key={station.id} id={`station-${station.id}`} station={station} />
			))}
		</>
	);
};

export default NearByStations;
