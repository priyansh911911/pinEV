import jsPDF from "jspdf";
import { format } from "date-fns";

function formatPDFAmount(amount: number): string {
	return amount.toLocaleString("en-IN", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

export const generateTransactionPDF = (transaction: Wallet) => {
	const doc = new jsPDF();
	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();
	const margin = 10; // Margin for the border

	// Add border around the page
	doc.setDrawColor(200, 200, 200);
	doc.setLineWidth(0.5);
	doc.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin, "S");

	// Add inner decorative border
	doc.setDrawColor(230, 230, 230);
	doc.setLineWidth(0.2);
	doc.rect(margin + 3, margin + 3, pageWidth - 2 * (margin + 3), pageHeight - 2 * (margin + 3), "S");

	// Add background color to header (adjusted for margin)
	doc.setFillColor(40, 42, 58); // Dark blue background
	doc.rect(margin, margin, pageWidth - 2 * margin, 40, "F");

	// Add logo (if you have one)
	doc.addImage("/logo-light.png", "PNG", 20, 15, 25, 25);

	// Add white text for header
	doc.setTextColor(255, 255, 255);
	doc.setFont("helvetica", "bold");
	doc.setFontSize(24);
	doc.text("Transaction Receipt", pageWidth / 2, margin + 20, { align: "center" });

	// Add transaction type badge
	const badgeText = transaction.type === "credit" ? "CREDIT" : "DEBIT";
	const badgeColor = transaction.type === "credit" ? [39, 174, 96] : [235, 87, 87];
	doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
	doc.roundedRect(pageWidth - (margin + 60), margin + 50, 50, 20, 3, 3, "F");
	doc.setTextColor(255, 255, 255);
	doc.setFontSize(12);
	doc.text(badgeText, pageWidth - (margin + 35), margin + 61, { align: "center" });

	// Add amount section
	doc.setTextColor(0, 0, 0);
	doc.setFontSize(14);
	doc.text("Amount", margin + 10, margin + 70);
	doc.setFontSize(24);
	doc.setTextColor(badgeColor[0], badgeColor[1], badgeColor[2]);
	doc.setFont("helvetica", "bold");

	// Format amount without any currency symbol first
	const formattedAmount = formatPDFAmount(Math.abs(transaction.amount));
	const amountText = `${transaction.type === "credit" ? "+" : "-"} Rs. ${formattedAmount}`;
	doc.text(amountText, margin + 10, margin + 85);

	// Add separator line
	doc.setDrawColor(230, 230, 230);
	doc.line(margin + 10, margin + 100, pageWidth - (margin + 10), margin + 100);

	// Add transaction details
	doc.setTextColor(80, 80, 80);
	doc.setFontSize(12);
	doc.setFont("helvetica", "normal");

	const details = [
		{ label: "Transaction ID", value: `#${transaction.id}` },
		{ label: "Date", value: format(transaction.date, "dd MMMM yyyy") },
		{ label: "Time", value: format(transaction.date, "hh:mm aa") },
		{ label: "Description", value: transaction.description },
		{ label: "Balance After Transaction", value: `Rs. ${formatPDFAmount(transaction.total_balance)}` },
	];

	details.forEach((detail, index) => {
		const y = margin + 120 + index * 20;
		doc.setTextColor(128, 128, 128);
		doc.text(detail.label, margin + 10, y);
		doc.setTextColor(0, 0, 0);
		doc.text(detail.value, margin + 10, y + 7);
	});

	// Add footer
	doc.setFillColor(248, 249, 250);
	doc.rect(margin, pageHeight - (margin + 30), pageWidth - 2 * margin, 30, "F");
	doc.setTextColor(128, 128, 128);
	doc.setFontSize(10);
	doc.text(
		"This is a computer generated receipt and does not require physical signature.",
		pageWidth / 2,
		pageHeight - (margin + 15),
		{
			align: "center",
		}
	);

	// Save the PDF
	doc.save(`transaction-${transaction.id}.pdf`);
};
