"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/layout";
import Header from "@/components/custom/header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import * as UserActions from "@/actions/users";
import Link from "next/link";

const AllUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await UserActions.getUsers({});
                if (res && !res.err) {
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

    const filteredUsers = users.filter((user: any) =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <Header headerBackground="bg-background" back>
                <h2 className="text-lg font-bold">All Users</h2>
            </Header>
            <Layout>
                <div className="mt-[90px] pb-20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 px-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold tracking-tight">All Users</h3>
                            <span className="text-sm text-muted-foreground">{filteredUsers.length} Users</span>
                        </div>
                        <div className="relative w-full sm:w-[300px]">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by name or email..."
                                className="pl-9 w-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    {isLoading ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : (
                        <div className="grid gap-3">
                            {filteredUsers.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No users found matching "{searchQuery}"
                                </div>
                            ) : (
                                filteredUsers.map((user: any) => (
                                    <Link key={user.id} href={`/admin/users/view/?id=${user.id}`}>
                                        <Card className="cursor-pointer hover:shadow-md transition-shadow">
                                            <CardContent className="p-4">
                                                <div className="flex flex-col">
                                                    <h3 className="font-semibold text-lg">{user.name}</h3>
                                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </Layout>
        </>
    );
};

export default AllUsersPage;
