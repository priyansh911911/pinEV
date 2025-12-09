import { format } from "date-fns";
import { Icons } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { generateTransactionPDF } from "@/lib/generate-pdf";

interface TransactionDetailsDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	transaction: Wallet;
}

const TransactionDetailsDialog = ({ isOpen, onOpenChange, transaction }: TransactionDetailsDialogProps) => {
	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(`#${transaction.id}`);
			toast.success("Transaction ID copied to clipboard");
		} catch (err) {
			toast.error("Failed to copy to clipboard");
		}
	};

	const handleDownload = () => {
		try {
			generateTransactionPDF(transaction);
			toast.success("Transaction receipt downloaded");
		} catch (err) {
			toast.error("Failed to download receipt");
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="bg-background p-0">
				<DialogHeader className="sr-only">
					<DialogTitle>Transaction Details</DialogTitle>
					<DialogDescription>Details of your transaction</DialogDescription>
				</DialogHeader>
				{/* Header with Amount */}
				<div className={`p-6 ${transaction.type === "credit" ? "bg-primary/10" : "bg-destructive/10"}`}>
					<div className="flex justify-between items-start mb-4">
						<Badge variant={transaction.type === "credit" ? "default" : "destructive"}>
							{transaction.type === "credit" ? "Credit" : "Debit"}
						</Badge>
					</div>

					<div className="text-center space-y-1">
						<p className="text-sm text-muted-foreground">Amount</p>
						<p
							className={`text-3xl font-bold ${
								transaction.type === "credit" ? "text-success" : "text-destructive"
							}`}
						>
							{transaction.type === "credit" ? "+" : "-"}
							{formatCurrency(Math.abs(transaction.amount))}
						</p>
						<p className="text-sm text-muted-foreground">
							Balance after transaction: {formatCurrency(transaction.total_balance)}
						</p>
					</div>
				</div>

				{/* Transaction Details */}
				<div className="space-y-4 p-6">
					<Card className="p-4 space-y-4">
						<div className="flex justify-between items-center">
							<div>
								<p className="text-sm text-muted-foreground">Description</p>
								<p className="font-medium">{transaction.description}</p>
							</div>
							<Icons.FileTextIcon className="text-muted-foreground h-4 w-4" />
						</div>

						<div className="flex justify-between items-center">
							<div>
								<p className="text-sm text-muted-foreground">Date & Time</p>
								<p className="font-medium">{format(transaction.date, "dd MMM yyyy")}</p>
							</div>
							<p className="text-sm text-muted-foreground">{format(transaction.date, "hh:mm aa")}</p>
						</div>

						<div className="flex justify-between items-center">
							<div>
								<p className="text-sm text-muted-foreground">Transaction ID</p>
								<p className="font-medium">#{transaction.id}</p>
							</div>
							<Button variant="outline" size="sm" className="rounded-full" onClick={handleCopy}>
								<Icons.CopyIcon className="h-3 w-3 mr-1" />
								Copy
							</Button>
						</div>
					</Card>

					{/* Quick Actions */}
					<div className="grid grid-cols-2 gap-3">
						<Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
							Close
						</Button>
						<Button variant="outline" className="w-full" onClick={handleDownload}>
							<Icons.DownloadIcon className="h-4 w-4 mr-2" />
							Download
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default TransactionDetailsDialog;
