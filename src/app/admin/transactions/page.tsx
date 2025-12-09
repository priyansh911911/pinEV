"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Layout from "@/components/layout";
import { Icons } from "@/components/icons";
import Header from "@/components/custom/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FlatList from "@/components/flat-list";
import { format } from "date-fns";
import * as TransactionActions from "@/actions/transactions";
import Stores from "@/lib/stores";
import { generateTransactionPDF } from "@/lib/generate-pdf";
import { toast } from "sonner";

const TransactionsPage = () => {
	const router = useRouter();
	const { user } = Stores();
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedType, setSelectedType] = useState<"all" | "credit" | "debit">("all");
	const [isLoading, setIsLoading] = useState(false);

	const filteredTransactions = transactions.filter(transaction => {
		const matchesSearch = transaction.description.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesType = selectedType === "all" || transaction.type === selectedType;
		return matchesSearch && matchesType;
	});

	const handleGetTransactions = useCallback(async () => {
		setIsLoading(true);
		try {
			const res = await TransactionActions.getTransactions({ search: `station.user:${user?.id}` });
			if (res.err) {
				return;
			}

			setTransactions(res.result);
		} catch (error) {
			console.error("Failed to fetch transactions:", error);
		} finally {
			setIsLoading(false);
		}
	}, [user]);

	useEffect(() => {
		handleGetTransactions();
	}, [handleGetTransactions]);

	const handleDownload = (transaction: Wallet) => {
		try {
			generateTransactionPDF(transaction);
			toast.success("Transaction receipt downloaded");
		} catch (err) {
			toast.error("Failed to download receipt");
		}
	};

	return (
		<>
			<Header headerBackground="bg-white" back>
				<h2 className="text-lg font-bold">Transactions</h2>
			</Header>

			<Layout>
				<div className="mt-[90px] pb-20">
					<div className="mb-5">
						<Input
							type="text"
							placeholder="Search transactions..."
							value={searchQuery}
							onChange={e => setSearchQuery(e.target.value)}
							className="mb-4"
						/>

						<Tabs defaultValue="all" onValueChange={value => setSelectedType(value as "all" | "credit" | "debit")}>
							<TabsList className="w-full justify-start overflow-x-auto mb-4">
								<TabsTrigger value="all">All</TabsTrigger>
								<TabsTrigger value="debit">Credits</TabsTrigger>
								<TabsTrigger value="credit">Debits</TabsTrigger>
							</TabsList>
						</Tabs>
					</div>

					{/* Transactions Summary Card */}
					<Card className="mb-6">
						<CardContent className="p-4">
							<div className="grid grid-cols-3 gap-4">
								<div className="flex flex-col">
									<span className="text-sm text-muted-foreground">Total</span>
									<span className="text-lg font-bold">
										{isLoading
											? "..."
											: `₹${transactions
													.reduce((sum, t) => sum + Number(t.amount || 0), 0)
													.toLocaleString()}`}
									</span>
								</div>
								<div className="flex flex-col">
									<span className="text-sm text-muted-foreground">Credits</span>
									<span className="text-lg font-bold text-green-600">
										{isLoading
											? "..."
											: `₹${transactions
													.filter(t => t.type === "debit")
													.reduce((sum, t) => sum + Number(t.amount || 0), 0)
													.toLocaleString()}`}
									</span>
								</div>
								<div className="flex flex-col">
									<span className="text-sm text-muted-foreground">Debits</span>
									<span className="text-lg font-bold text-red-600">
										{isLoading
											? "..."
											: `₹${transactions
													.filter(t => t.type === "credit")
													.reduce((sum, t) => sum + Number(t.amount || 0), 0)
													.toLocaleString()}`}
									</span>
								</div>
							</div>
						</CardContent>
					</Card>

					{isLoading ? (
						<div className="flex items-center justify-center min-h-[200px]">
							<Icons.LoadingIcon className="w-6 h-6 animate-spin" />
						</div>
					) : filteredTransactions.length > 0 ? (
						<FlatList
							data={filteredTransactions}
							keyExtractor={transaction => transaction.id}
							renderItem={(transaction: any) => (
								<Card key={transaction.id} className="mb-4">
									<CardContent className="p-4">
										<div className="flex justify-between items-start mb-2">
											<div>
												<h3 className="font-semibold line-clamp-1">{transaction.description}</h3>
												<p className="text-xs text-muted-foreground">
													{format(new Date(transaction.date), "PP p")}
												</p>
											</div>
											<Badge
												variant={transaction.type === "debit" ? "default" : "destructive"}
												className="ml-2"
											>
												{transaction.type === "debit" ? "Credit" : "Debit"}
											</Badge>
										</div>

										<div className="flex justify-between items-center mt-3">
											<div className="flex items-center">
												<Icons.UserIcon className="w-4 h-4 mr-2 text-muted-foreground" />
												<span className="text-sm text-muted-foreground">{transaction.user.name}</span>
											</div>
											<div
												className={cn(
													"text-lg font-bold",
													transaction.type === "debit" ? "text-green-600" : "text-red-600"
												)}
											>
												{transaction.type === "debit" ? "+" : "-"}₹{transaction.amount.toLocaleString()}
											</div>
										</div>

										<div className="mt-3 flex items-center gap-2">
											<Button
												variant="outline"
												size="sm"
												className="flex-1"
												onClick={() => router.push(`/admin/transactions/view?id=${transaction.id}`)}
											>
												<Icons.EyeIcon className="w-4 h-4 mr-1" />
												View Details
											</Button>
											<Button
												onClick={() => handleDownload(transaction)}
												variant="outline"
												size="sm"
												className="flex-1"
											>
												<Icons.FileTextIcon className="w-4 h-4 mr-1" />
												Generate Receipt
											</Button>
										</div>
									</CardContent>
								</Card>
							)}
							// noResultsText={
							// 	<div className="flex flex-col items-center justify-center py-10">
							// 		<Icons.SearchXIcon className="w-10 h-10 text-muted-foreground mb-3" />
							// 		<h3 className="text-lg font-medium mb-1">No Transactions Found</h3>
							// 		<p className="text-sm text-center text-muted-foreground max-w-xs">
							// 			We could not find any transactions matching your search criteria. Try adjusting your search.
							// 		</p>
							// 	</div>
							// }
						/>
					) : (
						<div className="flex flex-col items-center justify-center min-h-[200px]">
							<Icons.WalletIcon className="w-10 h-10 text-muted-foreground mb-3" />
							<h3 className="text-lg font-medium mb-1">No Transactions Available</h3>
							<p className="text-sm text-center text-muted-foreground max-w-xs">
								There are no transactions in the system yet. Transactions will appear here when users make
								payments.
							</p>
						</div>
					)}

					<Button
						variant="outline"
						onClick={() => handleGetTransactions()}
						className="fixed bottom-tab !w-fit right-5 rounded-full shadow-lg bg-opacity-5 backdrop-blur-sm"
					>
						<Icons.RefreshCcwIcon className="w-4 h-4 mr-2" />
						Refresh
					</Button>
				</div>
			</Layout>
		</>
	);
};

export default TransactionsPage;
