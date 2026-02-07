"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/layout";
import Header from "@/components/custom/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";
import { getVehiclesChargings } from "@/actions/vehicles-chargings";
import { Icons } from "@/components/icons";

const ChargingStatusPage = () => {
    const [chargings, setChargings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await getVehiclesChargings({
                    sort: "-created_at",
                    joins: "station:stations,vehicle:vehicles,charging_slot:stations_slots,user:users"
                });
                console.log("Charging status response:", res);

                if (res && !res.err) {
                    setChargings(res.result);
                }
            } catch (error) {
                console.error("Failed to fetch charging sessions:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "bg-green-100 text-green-700 hover:bg-green-100";
            case "completed":
                return "bg-blue-100 text-blue-700 hover:bg-blue-100";
            case "scheduled":
                return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100";
            case "cancelled":
                return "bg-red-100 text-red-700 hover:bg-red-100";
            default:
                return "bg-slate-100 text-slate-700 hover:bg-slate-100";
        }
    };

    return (
        <>
            <Header headerBackground="bg-background" back>
                <h2 className="text-lg font-bold">Vehicle Charging Status</h2>
            </Header>
            <Layout>
                <div className="mt-[90px] pb-20">
                    {isLoading ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : (
                        <div className="grid gap-4">
                            {chargings.length === 0 ? (
                                <Card>
                                    <CardContent className="p-8 text-center text-slate-500">
                                        No charging sessions found.
                                    </CardContent>
                                </Card>
                            ) : (
                                chargings.map((session: any) => (
                                    <Card key={session.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                        <CardHeader className="bg-slate-50/50 p-4 border-b">
                                            <div className="flex justify-between items-start">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-xs text-slate-500">#{session.id}</span>
                                                        <Badge className={cn("capitalize border-none shadow-none h-5", getStatusColor(session.status))}>
                                                            {session.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-sm text-slate-500">
                                                        {formatDate("DD MMM YYYY, hh:mm A", session.created_at)}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-lg font-bold">₹{session.final_amount || session.amount_paid || 0}</span>
                                                    <span className="text-xs text-slate-400">{session.duration_in_minute} mins</span>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4">
                                            <div className="grid gap-4">
                                                {/* Station & Slot Info */}
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-1 p-2 bg-blue-50 rounded-lg">
                                                        <Icons.ChargingStationIcon className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm">{session.station?.name || `Station #${session.station}`}</p>
                                                        <p className="text-xs text-slate-500">{session.station?.address}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-white">
                                                                {session.charging_slot?.name || `Slot #${session.charging_slot}`}
                                                            </Badge>
                                                            <span className="text-[10px] text-slate-400">
                                                                {session.charging_slot?.connector_type} • {session.charging_slot?.power}kW
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Vehicle & User Info */}
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-1 p-2 bg-purple-50 rounded-lg">
                                                        <Icons.CarIcon className="w-4 h-4 text-purple-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm">
                                                            {session.vehicle?.brand} {session.vehicle?.model}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {session.vehicle?.registration_number || `Vehicle #${session.vehicle}`}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className="flex items-center gap-1">
                                                                <Icons.UserIcon className="w-3 h-3 text-slate-400" />
                                                                <span className="text-xs text-slate-600">{session.user?.name || `User #${session.user}`}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Charge Metrics (Only if available) */}
                                                {(session.initial_reading || session.final_reading) && (
                                                    <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                        <div className="grid grid-cols-2 gap-4 text-xs">
                                                            <div>
                                                                <span className="text-slate-400 block mb-0.5">Energy Consumed</span>
                                                                <span className="font-semibold text-slate-700">
                                                                    {session.final_reading?.energy
                                                                        ? (Number(session.final_reading.energy) - (session.initial_reading || 0)).toFixed(2)
                                                                        : "0.00"} kWh
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-400 block mb-0.5">Transaction ID</span>
                                                                <span className="font-mono text-slate-600">{session.charge_txn_id || "-"}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </Layout>
        </>
    );
};

export default ChargingStatusPage;
