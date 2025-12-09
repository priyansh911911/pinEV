import { Icons } from "@/components/icons";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { FC, Fragment, useState } from "react";
import TransactionDetailsDrawer from "./transaction-details.drawer";

interface TransactionCardProps {
	transaction: Wallet;
}

const TransactionCard: FC<TransactionCardProps> = ({ transaction }) => {
	const [showDetails, setShowDetails] = useState(false);

	return (
		<>
			<Card className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => setShowDetails(true)}>
				<CardContent className="p-4 flex justify-between items-center">
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
							<p className="text-sm text-muted-foreground">{format(transaction.date, "dd MMM yyyy, hh:mm a")}</p>
						</div>
					</div>
					<p
						className={`font-semibold whitespace-nowrap ${
							transaction.type === "credit" ? "text-success" : "text-destructive"
						}`}
					>
						{transaction.type === "credit" ? "+" : "-"}
						{formatCurrency(Math.abs(transaction.amount))}
					</p>
				</CardContent>
			</Card>

			<TransactionDetailsDrawer isOpen={showDetails} onOpenChange={setShowDetails} transaction={transaction} />
		</>
	);
};

export default TransactionCard;

export const TransactionCardSkeleton = ({ count = 1 }: { count: number }) => {
	return (
		<>
			{Array.from({ length: count }).map((_, index) => (
				<div
					key={index}
					className="p-4 bg-card rounded-lg border border-border flex justify-between items-center animate-pulse"
				>
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-full bg-slate-200" />
						<div className="flex flex-col gap-1">
							<div className="h-4 w-32 bg-slate-200 rounded" />
							<div className="h-4 w-24 bg-slate-200 rounded" />
						</div>
					</div>
					<div className="h-8 w-16 bg-slate-200 rounded" />
				</div>
			))}
		</>
	);
};
