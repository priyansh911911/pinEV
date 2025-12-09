import { FC } from "react";
import { format } from "date-fns";
import { Icons } from "@/components/icons";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface HistoryDialogProps {
	isHistoryOpen: boolean;
	setIsHistoryOpen: React.Dispatch<React.SetStateAction<boolean>>;
	transactions: Wallet[];
}

const HistoryDialog: FC<HistoryDialogProps> = ({ isHistoryOpen, setIsHistoryOpen, transactions }) => {
	return (
		<Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
			<DialogContent className="sm:max-w-[768px] h-[80vh]">
				<DialogHeader>
					<DialogTitle>Transaction History</DialogTitle>
				</DialogHeader>
				<div className="flex-1 overflow-auto py-4">
					<div className="space-y-4">
						{transactions.map(transaction => (
							<Card key={transaction.id} className="hover:bg-accent/50 transition-colors">
								<CardContent className="p-4">
									<div className="flex items-center justify-between mb-2">
										<div className="flex items-center gap-3">
											<div
												className={`w-10 h-10 rounded-full flex items-center justify-center ${
													transaction.type === "credit" ? "bg-primary/10" : "bg-destructive/10"
												}`}
											>
												{transaction.type === "credit" ? (
													<Icons.ArrowLeftIcon className="text-primary -rotate-90" />
												) : (
													<Icons.ArrowLeftIcon className="text-destructive rotate-90" />
												)}
											</div>
											<div>
												<p className="font-medium">{transaction.description}</p>
												<p className="text-sm text-muted-foreground">
													{format(transaction.date, "dd MMM yyyy, HH:mm")}
												</p>
											</div>
										</div>
										<p
											className={`font-semibold ${
												transaction.type === "credit" ? "text-success" : "text-destructive"
											}`}
										>
											{transaction.type === "credit" ? "+" : "-"}
											{formatCurrency(Math.abs(transaction.amount))}
										</p>
									</div>
									<div className="pt-2 border-t">
										<p className="text-sm text-muted-foreground">
											Balance after transaction: {formatCurrency(transaction.total_balance)}
										</p>
										<p className="text-sm text-muted-foreground">Transaction ID: #{transaction.id}</p>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => setIsHistoryOpen(false)} className="w-full">
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default HistoryDialog;
