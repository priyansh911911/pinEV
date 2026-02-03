"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { updateStation } from "@/actions/stations";

interface EditStationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    station: AdminStation | null;
    onSuccess: () => void;
}

const EditStationModal: React.FC<EditStationModalProps> = ({
    open,
    onOpenChange,
    station,
    onSuccess,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        phone: "",
        email: "",
    });

    useEffect(() => {
        if (station) {
            setFormData({
                name: station.name,
                address: station.address,
                phone: station.details?.phone || "",
                email: station.details?.email || "",
            });
        }
    }, [station, open]);

    const handleUpdate = async () => {
        if (!station) return;
        if (!formData.name) {
            toast.error("Station name is required");
            return;
        }

        setIsLoading(true);
        try {
            const res = await updateStation({
                id: station.id,
                body: {
                    name: formData.name,
                    address: formData.address,
                    details: {
                        ...station.details,
                        phone: formData.phone,
                        email: formData.email,
                    },
                },
            });

            if (res.err) {
                toast.error("Failed to update station");
            } else {
                toast.success("Station updated successfully");
                onSuccess();
                onOpenChange(false);
            }
        } catch (error) {
            toast.error("An error occurred while updating");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Station Details</DialogTitle>
                    <DialogDescription>
                        Update the basic information for this charging station.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="col-span-3"
                            placeholder="Station Name"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="address" className="text-right">
                            Location
                        </Label>
                        <Textarea
                            id="address"
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            className="col-span-3 min-h-[80px]"
                            placeholder="Station Address"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">
                            Phone
                        </Label>
                        <Input
                            id="phone"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            className="col-span-3"
                            placeholder="Phone Number"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                            Email
                        </Label>
                        <Input
                            id="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="col-span-3"
                            placeholder="Email Address"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleUpdate} disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Icons.LoadingIcon className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            "Update Station"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EditStationModal;
