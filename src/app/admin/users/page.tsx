"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/layout";
import Header from "@/components/custom/header";
import { Card, CardContent } from "@/components/ui/card";
import * as UserActions from "@/actions/users";

const UsersPage = () => {
	const [users, setUsers] = useState([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchUsers = async () => {
			try {
				const res = await UserActions.getUsers({});
				if (!res.err) {
					setUsers(res.result);
				}
			} catch (error) {
				console.error("Failed to fetch users:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchUsers();
	}, []);

	return (
		<>
			<Header headerBackground="bg-background" back>
				<h2 className="text-lg font-bold">Users</h2>
			</Header>
			<Layout>
				<div className="mt-[90px] pb-20">
					{isLoading ? (
						<div className="text-center py-8">Loading...</div>
					) : (
						<div className="space-y-3">
							{users.map((user: any) => (
								<Card key={user.id} className="cursor-pointer" onClick={() => window.location.href = `/admin/users/view/?id=${user.id}`}>
									<CardContent className="p-4">
										<div className="flex flex-col">
											<h3 className="font-semibold">{user.name}</h3>
											<p className="text-sm text-muted-foreground">{user.email}</p>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</div>
			</Layout>
		</>
	);
};

export default UsersPage;