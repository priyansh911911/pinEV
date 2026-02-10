"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Layout from "@/components/layout";
import Header from "@/components/custom/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import * as UserActions from "@/actions/users";
import * as VehicleActions from "@/actions/vehicles";
import * as ChargingActions from "@/actions/vehicles-chargings";
import * as TransactionActions from "@/actions/transactions";
import { Car, Zap, Mail, Phone, Calendar, ShieldCheck, TrendingUp, TrendingDown } from "lucide-react";

const UserDetailPage = () => {
    return (
        <Suspense fallback={<div className="mt-[90px] text-center py-10">Loading...</div>}>
            <Component />
        </Suspense>
    );
};

export default UserDetailPage;

const Component = () => {
    const searchParams = useSearchParams();
    const id = searchParams.get("id");

    const [user, setUser] = useState<any>(null);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [chargings, setChargings] = useState<any[]>([]);
    const [walletStats, setWalletStats] = useState({ totalCredit: 0, totalDebit: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                // Fetch User Details - using search as filter if direct ID access is tricky
                const userRes = await UserActions.getUserById(id);
                if (userRes && !userRes.err) {
                    // Check if result is array or single object
                    if (Array.isArray(userRes.result)) {
                        setUser(userRes.result[0] || null);
                    } else {
                        setUser(userRes.result);
                    }
                } else {
                    // Fallback to searching by ID if /users/ID doesn't work
                    const searchRes = await UserActions.getUsers({ search: `id:${id}` });
                    if (searchRes && !searchRes.err && searchRes.result?.length > 0) {
                        setUser(searchRes.result[0]);
                    }
                }

                // Fetch Vehicles - Using search: field:value pattern which is common in this project
                const vehiclesData = await VehicleActions.getVehicles({ search: `user:${id}` });
                if (vehiclesData && !vehiclesData.err) {
                    setVehicles(Array.isArray(vehiclesData.result) ? vehiclesData.result : []);
                }

                // Fetch Chargings - Using search: field:value pattern
                const chargingsData = await ChargingActions.getVehiclesChargings({ search: `user:${id}` });
                if (chargingsData && !chargingsData.err) {
                    setChargings(Array.isArray(chargingsData.result) ? chargingsData.result : []);
                }

                // Fetch User Transactions for Wallet Stats
                const transactionsRes = await TransactionActions.getTransactions({ search: `user:${id}` });
                if (!transactionsRes.err) {
                    const transactions = transactionsRes.result || [];

                    // Calculate User Credit
                    const totalCredit = transactions
                        .filter((t: any) => t.type === "credit")
                        .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

                    // Calculate User Debit
                    const totalDebit = transactions
                        .filter((t: any) => t.type === "debit")
                        .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

                    setWalletStats({ totalCredit, totalDebit });
                }
            } catch (error) {
                console.error("Failed to fetch user data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (isLoading) {
        return (
            <>
                <Header headerBackground="bg-background" back>
                    <h2 className="text-lg font-bold">User Details</h2>
                </Header>
                <Layout>
                    <div className="mt-[90px] text-center py-10 text-slate-500">
                        <div className="animate-pulse">Loading User Profile...</div>
                    </div>
                </Layout>
            </>
        );
    }

    if (!user) {
        return (
            <>
                <Header headerBackground="bg-background" back>
                    <h2 className="text-lg font-bold">User Not Found</h2>
                </Header>
                <Layout>
                    <div className="mt-[90px] text-center py-10">
                        <p className="text-slate-500">User not found or ID is missing.</p>
                    </div>
                </Layout>
            </>
        );
    }

    return (
        <>
            <Header headerBackground="bg-background" back>
                <h2 className="text-lg font-bold">User Profile</h2>
            </Header>
            <Layout>
                <div className="mt-[90px] pb-20 space-y-6">

                    {/* User Basic Info */}
                    <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-white to-slate-50">
                        <CardHeader className="bg-slate-900 text-white p-4 md:p-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative">
                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left z-10 w-full md:w-auto">
                                    <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-slate-700 flex items-center justify-center text-2xl md:text-3xl font-bold shrink-0 border-2 border-slate-600 shadow-md">
                                        {user.name?.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-2xl md:text-3xl font-bold truncate tracking-tight">{user.name}</CardTitle>
                                        <p className="text-slate-400 text-sm md:text-base font-medium">ID: {user.id}</p>
                                        <Badge variant="secondary" className="mt-2 bg-blue-500/10 text-blue-200 border border-blue-500/20 px-3 py-0.5 text-xs md:text-sm shadow-sm">
                                            {user.role || 'User'}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Wallet Stats in Header */}
                                <div className="flex flex-row w-full md:w-auto items-center justify-between md:justify-end gap-2 md:gap-8 mt-4 md:mt-0 bg-slate-800/50 md:bg-transparent rounded-xl p-4 md:p-0 border border-slate-700/50 md:border-none backdrop-blur-sm md:backdrop-blur-none">
                                    <div className="flex flex-col items-center md:items-end flex-1 md:flex-none">
                                        <div className="flex items-center gap-1.5 text-green-400 mb-1">
                                            <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                            <span className="text-[10px] md:text-sm font-bold uppercase tracking-wider opacity-90">Total Credit</span>
                                        </div>
                                        <p className="text-lg md:text-2xl font-bold text-green-300 tracking-tight">₹ {walletStats.totalCredit.toLocaleString()}</p>
                                    </div>

                                    <div className="bg-slate-700 w-px h-8 md:h-10 mx-2 md:mt-1"></div>

                                    <div className="flex flex-col items-center md:items-end flex-1 md:flex-none">
                                        <div className="flex items-center gap-1.5 text-red-400 mb-1">
                                            <TrendingDown className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                            <span className="text-[10px] md:text-sm font-bold uppercase tracking-wider opacity-90">Total Debit</span>
                                        </div>
                                        <p className="text-lg md:text-2xl font-bold text-red-300 tracking-tight">₹ {walletStats.totalDebit.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            <div className="flex items-start md:items-center gap-3">
                                <Mail className="h-5 w-5 text-slate-400 shrink-0 mt-0.5 md:mt-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] md:text-xs text-slate-500 uppercase font-semibold">Email</p>
                                    <p className="text-sm md:text-base text-slate-900 break-all md:truncate">{user.email || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-start md:items-center gap-3">
                                <Phone className="h-5 w-5 text-slate-400 shrink-0 mt-0.5 md:mt-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] md:text-xs text-slate-500 uppercase font-semibold">Phone</p>
                                    <p className="text-sm md:text-base text-slate-900">{user.phone || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-start md:items-center gap-3">
                                <Calendar className="h-5 w-5 text-slate-400 shrink-0 mt-0.5 md:mt-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] md:text-xs text-slate-500 uppercase font-semibold">Joined On</p>
                                    <p className="text-sm md:text-base text-slate-900">{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-start md:items-center gap-3">
                                <ShieldCheck className="h-5 w-5 text-slate-400 shrink-0 mt-0.5 md:mt-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] md:text-xs text-slate-500 uppercase font-semibold">Status</p>
                                    <Badge variant={user.is_active ? "default" : "destructive"} className="text-[10px] md:text-xs py-0 h-5">
                                        {user.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Vehicles Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <Car className="h-5 w-5 text-blue-600" />
                            <h3 className="text-lg md:text-xl font-bold text-slate-800">Vehicles</h3>
                        </div>

                        {vehicles.length === 0 ? (
                            <Card className="bg-slate-50 border-dashed border-2">
                                <CardContent className="p-6 text-center text-slate-500 text-sm md:text-base">
                                    No vehicles registered for this user.
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {vehicles.map((vehicle) => (
                                    <Card key={vehicle.id} className="hover:shadow-lg transition-shadow border-none shadow-sm bg-white overflow-hidden">
                                        <CardContent className="p-4 md:p-5">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="text-base md:text-lg font-bold text-slate-900 truncate">{vehicle.model}</h4>
                                                    <p className="text-xs md:text-sm text-slate-500 truncate">{vehicle.brand}</p>
                                                </div>
                                                <Badge variant="outline" className="bg-slate-50 capitalize text-[10px] shrink-0 ml-2">
                                                    {vehicle.color}
                                                </Badge>
                                            </div>
                                            <div className="space-y-2 text-xs md:text-sm">
                                                <div className="flex justify-between border-b pb-1">
                                                    <span className="text-slate-500">Reg No:</span>
                                                    <span className="font-mono font-semibold break-all text-right ml-2">{vehicle.details?.vehicle_number || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between border-b pb-1">
                                                    <span className="text-slate-500">Type:</span>
                                                    <span className="text-right ml-2">{vehicle.details?.vehicle_type || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between border-b pb-1">
                                                    <span className="text-slate-500">Year:</span>
                                                    <span className="text-right ml-2">{vehicle.details?.year_of_manufacture || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Battery:</span>
                                                    <span className="text-right ml-2">{vehicle.details?.battery_capacity} kWh</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Charging History Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <Zap className="h-5 w-5 text-amber-500" />
                            <h3 className="text-lg md:text-xl font-bold text-slate-800">Charging History</h3>
                        </div>

                        <div className="bg-white rounded-xl shadow-md overflow-hidden border">
                            <div className="overflow-x-auto scrollbar-hide">
                                <table className="w-full text-left border-collapse min-w-[600px] md:min-w-full">
                                    <thead className="bg-slate-50 border-b">
                                        <tr>
                                            <th className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-600">Date & Time</th>
                                            <th className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-600">Station</th>
                                            <th className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-600">Duration</th>
                                            <th className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-600">Amount</th>
                                            <th className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-600">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {chargings.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-4 md:px-6 py-10 text-center text-slate-500 text-sm md:text-base">
                                                    No charging history found.
                                                </td>
                                            </tr>
                                        ) : (
                                            chargings.map((session) => (
                                                <tr key={session.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm text-slate-700">
                                                        {session.datetime || new Date(session.created_at).toLocaleString()}
                                                    </td>
                                                    <td className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm text-slate-700 truncate max-w-[150px]">{session.station || 'N/A'}</td>
                                                    <td className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm text-slate-700">{session.duration_in_minute} min</td>
                                                    <td className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-bold text-green-600 whitespace-nowrap">₹{session.amount_paid}</td>
                                                    <td className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm">
                                                        <Badge
                                                            variant={session.status === 'completed' ? 'default' : 'secondary'}
                                                            className={session.status === 'completed' ? 'bg-green-100 text-green-700 hover:bg-green-200 border-none px-2 py-0 text-[10px]' : 'px-2 py-0 text-[10px]'}
                                                        >
                                                            {session.status}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>


                </div>
            </Layout>
        </>
    );
};
