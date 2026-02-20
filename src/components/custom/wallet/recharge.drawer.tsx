import { FC } from "react";
import { formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";

interface RechargeDrawerProps {
	isRechargeModalOpen: boolean;
	setIsRechargeModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	handleRecharge: (e: React.FormEvent<HTMLFormElement>) => void;
	fields: { amount: string; description: string };
	setFields: React.Dispatch<React.SetStateAction<{ amount: string; description: string }>>;
	isSubmitting: boolean;
}

const RechargeDrawer: FC<RechargeDrawerProps> = ({
	isRechargeModalOpen,
	setIsRechargeModalOpen,
	fields,
	handleRecharge,
	isSubmitting,
	setFields,
}) => {
	return (
		<Drawer open={isRechargeModalOpen} onOpenChange={setIsRechargeModalOpen}>
			<DrawerContent className="max-h-[90%] default-page-width !w-full mb-10">
				<DrawerHeader>
					<DrawerTitle>Add Money to Wallet</DrawerTitle>
				</DrawerHeader>

				<form onSubmit={handleRecharge} className="px-4">
					<div className="space-y-6">
						{/* Amount Input */}
						<div className="space-y-2">
							<div className="relative">
								<div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
									₹
								</div>
								<Input
									type="number"
									placeholder="Custom Amount"
									className="pl-8"
									value={fields.amount}
									onChange={e => setFields({ ...fields, amount: e.target.value })}
								/>
							</div>

							{/* Quick Amount Buttons */}
							<div className="grid grid-cols-4 gap-2">
								{[50, 100, 500, 1000].map(amount => (
									<Button
										key={amount}
										type="button"
										variant="outline"
										size="sm"
										onClick={() => setFields(prev => ({ ...prev, amount: String(amount) }))}
									>
										{formatCurrency(amount)}
									</Button>
								))}
							</div>
						</div>

						{/* Note Input */}
						<Input
							placeholder="Add note (optional)"
							value={fields.description}
							onChange={e => setFields({ ...fields, description: e.target.value })}
						/>
					</div>
				</form>

				<DrawerFooter className="pt-2">
					<Button
						isLoading={isSubmitting}
						className="w-full rounded-full"
						type="submit"
						disabled={Number(fields.amount) <= 0}
						onClick={(e: any) => handleRecharge(e)}
					>
						Add {fields.amount ? formatCurrency(Number(fields.amount)) : "Money"}
					</Button>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
};

export default RechargeDrawer;
