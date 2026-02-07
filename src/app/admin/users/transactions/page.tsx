"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/layout";
import Header from "@/components/custom/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import * as TransactionActions from "@/actions/transactions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const UserTransactionsPage = () => {
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [txSearchQuery, setTxSearchQuery] = useState("");
    const [timeFilter, setTimeFilter] = useState("all");

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const res = await TransactionActions.getTransactions({});
                if (res && !res.err) {
                    setTransactions(res.result);
                }
            } catch (error) {
                console.error("Failed to fetch transactions:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTransactions();
    }, []);

    const filteredTransactions = transactions.filter((tx: any) => {
        // Filter by search query
        if (txSearchQuery) {
            const query = txSearchQuery.toLowerCase();
            const matchesSearch =
                tx.user?.name?.toLowerCase().includes(query) ||
                tx.user?.email?.toLowerCase().includes(query) ||
                tx.description?.toLowerCase().includes(query) ||
                tx.id?.toString().includes(query);

            if (!matchesSearch) return false;
        }

        // Filter by time
        if (timeFilter === "all") return true;

        const txDate = new Date(tx.date || tx.created_at);
        const now = new Date();

        if (timeFilter === "day") {
            return txDate.toLocaleDateString() === now.toLocaleDateString();
        }

        if (timeFilter === "week") {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return txDate >= weekAgo;
        }

        if (timeFilter === "month") {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return txDate >= monthAgo;
        }

        return true;
    });

    return (
        <>
            <Header headerBackground="bg-background" back>
                <h2 className="text-lg font-bold">User Transactions</h2>
            </Header>
            <Layout>
                <div className="mt-[90px] pb-20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 px-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold tracking-tight">User Transactions</h3>
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none">{filteredTransactions.length} Total</Badge>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                            <div className="relative w-full sm:w-[250px]">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search transactions..."
                                    className="pl-9 w-full"
                                    value={txSearchQuery}
                                    onChange={(e) => setTxSearchQuery(e.target.value)}
                                />
                            </div>
                            <Select value={timeFilter} onValueChange={setTimeFilter}>
                                <SelectTrigger className="w-full sm:w-[150px]">
                                    <SelectValue placeholder="Select period" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Time</SelectItem>
                                    <SelectItem value="day">Today</SelectItem>
                                    <SelectItem value="week">Last 7 Days</SelectItem>
                                    <SelectItem value="month">Last 30 Days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {isLoading ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : (
                        <div className="max-h-[800px] overflow-y-auto pr-2 grid gap-3 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                            {filteredTransactions.length === 0 ? (
                                <Card>
                                    <CardContent className="p-8 text-center text-slate-500">
                                        No transactions found.
                                    </CardContent>
                                </Card>
                            ) : (
                                filteredTransactions.map((tx: any) => (
                                    <Card key={tx.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                        <CardContent className="p-4">
                                            <div className="flex flex-col gap-3">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-mono text-slate-400">#{tx.id}</span>
                                                        <span className="text-sm text-slate-500">{new Date(tx.date || tx.created_at).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true, month: 'numeric', day: 'numeric', year: 'numeric' })}</span>
                                                    </div>
                                                    <div className={cn("text-lg font-bold", tx.type === 'credit' ? "text-green-600" : "text-red-600")}>
                                                        {tx.type === 'credit' ? '+' : '-'}₹{Math.abs(tx.amount).toFixed(2)}
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <div className="bg-slate-100 rounded-full h-8 w-8 flex items-center justify-center text-slate-600 font-bold text-xs">
                                                            {tx.user?.name?.charAt(0) || 'U'}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium text-slate-900">{tx.user?.name || `User #${tx.user_id}`}</span>
                                                            <span className="text-xs text-slate-500">{tx.user?.email}</span>
                                                        </div>
                                                    </div>
                                                    <Badge
                                                        className={cn(
                                                            "capitalize border-none shadow-none h-6",
                                                            tx.type === 'credit' ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-red-100 text-red-700 hover:bg-red-100"
                                                        )}
                                                    >
                                                        {tx.type}
                                                    </Badge>
                                                </div>

                                                <div className="flex justify-between items-end pt-2 border-t mt-1">
                                                    <p className="text-sm text-slate-600 truncate max-w-[70%]" title={tx.description}>
                                                        {tx.description}
                                                    </p>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Balance</span>
                                                        <span className="text-sm font-medium text-slate-700">₹{Number(tx.total_balance || 0).toFixed(2)}</span>
                                                    </div>
                                                </div>
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

export default UserTransactionsPage;
