"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Layout from "@/components/layout";
import Header from "@/components/custom/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import * as UserActions from "@/actions/users";
import * as TransactionActions from "@/actions/transactions";
import * as VehicleChargingActions from "@/actions/vehicles-chargings";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function UserDetailsPage() {
	const params = useParams();
	const userId = params.id;
	const [user, setUser] = useState<any>(null);
	const [transactions, setTransactions] = useState([]);
	const [filteredTransactions, setFilteredTransactions] = useState([]);
	const [timeFilter, setTimeFilter] = useState('all');
	const [stats, setStats] = useState({
		credits: 0,
		debits: 0,
		energyUsed: 0,
		chargeHours: 0
	});
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchUserData = async () => {
			try {
				const userRes = await UserActions.getUsers({ search: `id:${userId}` });
				const transRes = await TransactionActions.getTransactions({ search: `user:${userId}` });
				const chargingRes = await VehicleChargingActions.getVehiclesChargings({ search: `user:${userId}` });

				if (!userRes.err && userRes.result.length > 0) {
					setUser(userRes.result[0]);
				}

				if (!transRes.err) {
					console.log('Transactions:', transRes.result);
					setTransactions(transRes.result);
					setFilteredTransactions(transRes.result);

					const credits = transRes.result.filter((t: any) => t.type === 'credit').reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
					const debits = transRes.result.filter((t: any) => t.type === 'debit').reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

					let energyUsed = 0;
					let chargeHours = 0;

					if (!chargingRes.err) {
						energyUsed = chargingRes.result.reduce((sum: number, c: any) => {
							if (c.status === 'completed' && c.final_reading && c.initial_reading) {
								const energyConsumed = Number(c.final_reading) - Number(c.initial_reading);
								return sum + (energyConsumed > 0 ? energyConsumed : 0);
							}
							return sum;
						}, 0);
						chargeHours = chargingRes.result.reduce((sum: number, c: any) => {
							if (c.status === 'completed' && c.started_at && c.stopped_at) {
								const start = new Date(c.started_at);
								const stop = new Date(c.stopped_at);
								if (!isNaN(start.getTime()) && !isNaN(stop.getTime())) {
									const minutes = (stop.getTime() - start.getTime()) / (1000 * 60);
									return sum + minutes;
								}
							}
							return sum;
						}, 0);
					}

					setStats({ credits, debits, energyUsed, chargeHours });
				}
			} catch (error) {
				console.error("Failed to fetch user data:", error);
			} finally {
				setIsLoading(false);
			}
		};

		if (userId) fetchUserData();
	}, [userId]);

	const filterTransactions = (filter: string) => {
		setTimeFilter(filter);
		const now = new Date();
		let filtered = transactions;

		if (filter !== 'all') {
			filtered = transactions.filter((t: any) => {
				const transDate = new Date(t.created_at);
				const diffTime = now.getTime() - transDate.getTime();
				const diffDays = diffTime / (1000 * 60 * 60 * 24);

				switch (filter) {
					case '1day': return diffDays <= 1;
					case '1week': return diffDays <= 7;
					case '1month': return diffDays <= 30;
					case '3month': return diffDays <= 90;
					case '6month': return diffDays <= 180;
					case '1year': return diffDays <= 365;
					default: return true;
				}
			});
		}
		setFilteredTransactions(filtered);
	};

	const downloadExcel = () => {
		console.log('Filtered transactions:', filteredTransactions);
		const wb = XLSX.utils.book_new();

		// Create user info data
		const userInfoData = [
			['User Information', ''],
			['Name', user?.name || ''],
			['Email', user?.email || ''],
			['Phone', user?.phone || ''],
			['', ''],
			['Account Summary', ''],
			['Credits', Math.round(stats.credits * 100) / 100],
			['Debits', Math.round(stats.debits * 100) / 100],
			['Energy Used (kWh)', Math.round(Math.abs(stats.energyUsed) * 100) / 100],
			['Charge Hours', Math.round(stats.chargeHours / 60)]
		];
		const userWs = XLSX.utils.aoa_to_sheet(userInfoData);
		XLSX.utils.book_append_sheet(wb, userWs, 'User Info');

		// Create transactions data - always add sheet
		const transHeaders = [['ID', 'Amount', 'Type', 'Description', 'Date', 'Balance']];
		const transRows = filteredTransactions.length > 0
			? filteredTransactions.map((t: any) => [
				t.id || '',
				t.amount || 0,
				t.type || '',
				t.description || '',
				t.created_at ? new Date(t.created_at).toLocaleDateString() : '',
				t.total_balance || 0
			])
			: [['No transactions found', '', '', '', '', '']];
		const transData = [...transHeaders, ...transRows];
		const transWs = XLSX.utils.aoa_to_sheet(transData);
		XLSX.utils.book_append_sheet(wb, transWs, 'Transactions');

		XLSX.writeFile(wb, `${user?.name || 'User'}_Statement.xlsx`);
	};

	const downloadPDF = () => {
		const doc = new jsPDF();

		// Header
		doc.setFontSize(16);
		doc.text(`Complete Statement - ${user?.name || 'User'}`, 20, 20);

		// User Information
		doc.setFontSize(12);
		doc.text('User Information:', 20, 35);
		doc.setFontSize(10);
		doc.text(`Name: ${user?.name || ''}`, 20, 45);
		doc.text(`Email: ${user?.email || ''}`, 20, 52);
		doc.text(`Phone: ${user?.phone || ''}`, 20, 59);

		// Stats
		doc.setFontSize(12);
		doc.text('Summary:', 20, 75);
		doc.setFontSize(10);
		doc.text(`Credits: Rs.${Math.round(stats.credits * 100) / 100}`, 20, 85);
		doc.text(`Debits: Rs.${Math.round(stats.debits * 100) / 100}`, 20, 92);
		doc.text(`Energy Used: ${Math.round(Math.abs(stats.energyUsed) * 100) / 100} kWh`, 20, 99);
		doc.text(`Charge Hours: ${Math.round(stats.chargeHours / 60)} hrs`, 20, 106);

		// Transactions Table
		const tableData = filteredTransactions.map((t: any) => [
			t.id,
			`Rs.${t.amount}`,
			t.type,
			t.description,
			new Date(t.created_at).toLocaleDateString(),
			`Rs.${t.total_balance}`
		]);

		autoTable(doc, {
			head: [['ID', 'Amount', 'Type', 'Description', 'Date', 'Balance']],
			body: tableData,
			startY: 120
		});

		doc.save(`${user?.name || 'User'}_Complete_Statement.pdf`);
	};

	if (isLoading) return <div className="text-center py-8">Loading...</div>;

	return (
		<>
			<Header headerBackground="bg-background" back>
				<h2 className="text-lg font-bold">User Details</h2>
			</Header>
			<Layout>
				<div className="mt-[90px] pb-20 space-y-4 flex flex-col h-[calc(100vh-90px)]">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Icons.UserIcon className="w-5 h-5" />
								User Information
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<p><span className="font-medium">Name:</span> {user?.name}</p>
								<p><span className="font-medium">Email:</span> {user?.email}</p>
								<p><span className="font-medium">Phone:</span> {user?.phone}</p>
							</div>
						</CardContent>
					</Card>

					<div className="grid grid-cols-2 gap-4">
						<Card>
							<CardContent className="p-4">
								<div className="flex items-center gap-2">
									<Icons.IndianRupeeIcon className="w-5 h-5 text-green-600" />
									<div>
										<p className="text-sm text-muted-foreground">Credits</p>
										<p className="text-xl font-bold">₹{Math.round(stats.credits * 100) / 100}</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-4">
								<div className="flex items-center gap-2">
									<Icons.IndianRupeeIcon className="w-5 h-5 text-red-600" />
									<div>
										<p className="text-sm text-muted-foreground">Debits</p>
										<p className="text-xl font-bold">₹{Math.round(stats.debits * 100) / 100}</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-4">
								<div className="flex items-center gap-2">
									<Icons.BatteryIcon className="w-5 h-5 text-blue-600" />
									<div>
										<p className="text-sm text-muted-foreground">Energy Used</p>
										<p className="text-xl font-bold">{Math.round(Math.abs(stats.energyUsed) * 100) / 100} kWh</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-4">
								<div className="flex items-center gap-2">
									<Icons.ClockIcon className="w-5 h-5 text-purple-600" />
									<div>
										<p className="text-sm text-muted-foreground">Charge Hours</p>
										<p className="text-xl font-bold">{Math.round(stats.chargeHours / 60)} hrs</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<div className="flex justify-between items-center flex-wrap gap-2">
								<CardTitle>Transactions</CardTitle>
								<div className="flex gap-2 items-center">
									<button
										onClick={downloadExcel}
										className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
									>
										Excel
									</button>
									<button
										onClick={downloadPDF}
										className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
									>
										PDF
									</button>
									<select
										value={timeFilter}
										onChange={(e) => filterTransactions(e.target.value)}
										className="px-3 py-1 text-sm border rounded"
									>
										<option value="all">All</option>
										<option value="1day">1 Day</option>
										<option value="1week">1 Week</option>
										<option value="1month">1 Month</option>
										<option value="3month">3 Months</option>
										<option value="6month">6 Months</option>
										<option value="1year">1 Year</option>
									</select>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<div className="overflow-y-auto max-h-96">
								{filteredTransactions.length > 0 ? (
									<table className="w-full table-fixed border-collapse">
										<thead>
											<tr className="border-b">
												<th className="text-left p-2 font-medium w-16">ID</th>
												<th className="text-left p-2 font-medium w-20">Amount</th>
												<th className="text-left p-2 font-medium w-16">Type</th>
												<th className="text-left p-2 font-medium">Description</th>
												<th className="text-left p-2 font-medium w-24">Date</th>
												<th className="text-left p-2 font-medium w-20">Balance</th>
											</tr>
										</thead>
										<tbody>
											{filteredTransactions.map((transaction: any) => (
												<tr key={transaction.id} className="border-b hover:bg-gray-50">
													<td className="p-2 text-xs truncate">{transaction.id}</td>
													<td className="p-2 text-xs font-medium">₹{transaction.amount}</td>
													<td className="p-2">
														<span className={`px-1 py-0.5 rounded text-xs ${transaction.type === 'credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
															{transaction.type}
														</span>
													</td>
													<td className="p-2 text-xs truncate">{transaction.description}</td>
													<td className="p-2 text-xs">{new Date(transaction.created_at).toLocaleDateString()}</td>
													<td className="p-2 text-xs">₹{transaction.total_balance}</td>
												</tr>
											))}
										</tbody>
									</table>
								) : (
									<p className="text-center text-muted-foreground py-4">No transactions found</p>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			</Layout>
		</>
	);
}