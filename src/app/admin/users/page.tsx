"use client";

import Layout from "@/components/layout";
import Header from "@/components/custom/header";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Users, FileText } from "lucide-react";

const UsersPage = () => {
	return (
		<>
			<Header headerBackground="bg-background" back>
				<h2 className="text-lg font-bold">Users & Transactions</h2>
			</Header>
			<Layout>
				<div className="mt-[90px] pb-20 px-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<Link href="/admin/users/transactions">
							<Card className="hover:shadow-lg transition-all cursor-pointer h-40 flex items-center justify-center border-2 hover:border-blue-500 bg-white">
								<CardContent className="flex flex-col items-center gap-3 p-6">
									<div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
										<FileText className="h-6 w-6 text-blue-600" />
									</div>
									<h3 className="text-xl font-bold text-slate-800">User Transactions</h3>
									<p className="text-sm text-slate-500">View all user transactions history</p>
								</CardContent>
							</Card>
						</Link>

						<Link href="/admin/users/all">
							<Card className="hover:shadow-lg transition-all cursor-pointer h-40 flex items-center justify-center border-2 hover:border-purple-500 bg-white">
								<CardContent className="flex flex-col items-center gap-3 p-6">
									<div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
										<Users className="h-6 w-6 text-purple-600" />
									</div>
									<h3 className="text-xl font-bold text-slate-800">All Users</h3>
									<p className="text-sm text-slate-500">Manage all registered users</p>
								</CardContent>
							</Card>
						</Link>
					</div>
				</div>
			</Layout>
		</>
	);
};

export default UsersPage;