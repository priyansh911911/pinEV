"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StationCard from "../station-card";
import { getStationPinIcon } from "@/functions/station-availability";

// Fix for default Leaflet icons
const fixLeafletIcons = () => {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });
};

// Component to handle map re-centering
const MapUpdater = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
};

interface MapContentProps {
    stations: StationWithNearby[];
    center: { lat: number; lng: number };
    bookings?: Booking[];
    chargingSessions?: VehicleCharging[];
}

const MapContent = ({ stations, center, bookings, chargingSessions }: MapContentProps) => {
    const [clickedStation, setClickedStation] = useState<StationWithNearby | null>(null);

    useEffect(() => {
        fixLeafletIcons();
    }, []);

    const mapCenter = useMemo(() => center, [center]);
    const nearestStation = useMemo(() => {
        if (!stations || stations.length === 0) return null;
        return [...stations].sort((a, b) => a.nearby - b.nearby)[0];
    }, [stations]);

    const handleMarkerClick = (station: StationWithNearby) => {
        setClickedStation(station);

        setTimeout(() => {
            const stationCardElement = document.getElementById(`station-${station.id}-opened`);
            if (stationCardElement) {
                stationCardElement.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
            }
        }, 100);
    };

    const createIcon = (station: StationWithNearby) => {
        const iconUrl = getStationPinIcon(
            station,
            bookings,
            chargingSessions,
            nearestStation?.id === station.id
        );

        return L.icon({
            iconUrl: iconUrl,
            iconSize: [48, 56],
            iconAnchor: [24, 52],
            popupAnchor: [0, -52],
            className: 'bouncy-pin'
        });
    };

    const initialCenter = useMemo(() => {
        return [
            Number(nearestStation?.latitude || mapCenter.lat),
            Number(nearestStation?.longitude || mapCenter.lng),
        ] as [number, number];
    }, [nearestStation, mapCenter]);

    return (
        <>
            <MapContainer
                center={initialCenter}
                zoom={13}
                style={{ width: "100%", height: "100%", zIndex: 0 }}
                zoomControl={false}
            >
                <MapUpdater center={initialCenter} />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {Array.isArray(stations) && stations.map((station, index) => (
                    <Marker
                        key={`station-${station.id}-${index}`}
                        position={[
                            Number(station?.latitude || mapCenter.lat),
                            Number(station?.longitude || mapCenter.lng),
                        ]}
                        icon={createIcon(station)}
                        eventHandlers={{
                            click: () => handleMarkerClick(station),
                        }}
                    />
                ))}
            </MapContainer>

            {clickedStation && (
                <Dialog open={!!clickedStation} onOpenChange={() => setClickedStation(null)}>
                    <DialogContent className="rounded-lg">
                        <DialogHeader>
                            <DialogTitle className="text-left sr-only">{clickedStation?.name}</DialogTitle>
                            <DialogDescription className="text-left sr-only">{clickedStation?.address}</DialogDescription>
                        </DialogHeader>
                        <StationCard id={`station-${clickedStation.id}-opened`} station={clickedStation} />
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
};

export default MapContent;
