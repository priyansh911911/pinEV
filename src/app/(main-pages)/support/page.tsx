"use client";

import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/layout";
import Header from "@/components/custom/header";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Stores from "@/lib/stores";
import { createSupportTicket } from "@/lib/support/actions";

export default function SupportPage() {
    const router = useRouter();
    const { user } = Stores();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        issue: "",
    });

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!formData.issue) {
            toast.error("Please describe your issue");
            return;
        }

        if (formData.phone.length !== 10) {
            toast.error("Please enter a valid 10-digit phone number");
            return;
        }

        setIsLoading(true);
        try {
            await createSupportTicket(formData);
            toast.success("Support request sent successfully!");
            router.push("/profile");
        } catch (error) {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Header left={
                <Button onClick={() => router.back()} variant="link" className="p-0 m-0 text-background">
                    <Icons.ArrowLeftIcon />
                </Button>
            }>
                <h1 className="text-lg font-semibold text-background">Help & Support</h1>
            </Header>

            <Layout className="pt-24 pb-10">
                <div className="space-y-6">
                    <div className="text-center">
                        <Icons.MessageCircleIcon className="w-12 h-12 text-primary mx-auto mb-2" />
                        <h2 className="text-2xl font-bold">How can we help?</h2>
                        <p className="text-muted-foreground">Our support team is available 24/7 for app issues and roadside assistance.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Your Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter your name"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="name@example.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                                    setFormData({ ...formData, phone: val });
                                }}
                                placeholder="Enter 10-digit number"
                                maxLength={10}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="issue">Describe your issue</Label>
                            <Textarea
                                id="issue"
                                rows={5}
                                value={formData.issue}
                                onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                                placeholder="Describe issue here"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 rounded-full font-bold"
                            disabled={isLoading}
                        >
                            {isLoading ? "Generating Ticket..." : "Submit Support Request"}
                        </Button>
                    </form>

                    <div className="bg-muted p-4 rounded-xl space-y-3">
                        <h3 className="font-semibold text-sm">Quick Contacts</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2">
                                    <Icons.PhoneIcon className="w-4 h-4 text-primary" />
                                    +91 77609 60542
                                </span>
                                <span className="text-muted-foreground italic">24/7 Help Desk</span>
                            </div>
                            <div className="flex items-center text-sm">
                                <span className="flex items-center gap-2">
                                    <Icons.MailIcon className="w-4 h-4 text-primary" />
                                    pincustomercare@gmail.com
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </Layout>
        </>
    );
}
