import jsPDF from "jspdf";
import QRCode from "qrcode";

export const generateQRCodePDF = async (stationId: string, slotId: string, stationName: string, slotName: string) => {
	try {
		const qrData = `${stationId}::${slotId}`;

		const qrCodeDataURL = await QRCode.toDataURL(qrData, {
			width: 200,
			margin: 2,
			color: {
				dark: "#000000",
				light: "#FFFFFF",
			},
		});

		// Create PDF
		const doc = new jsPDF();
		const pageWidth = doc.internal.pageSize.getWidth();
		const margin = 20;

		// Add QR code
		const qrSize = 120;
		// put the qr code horizontally centered
		const qrX = (pageWidth - qrSize) / 2;
		const qrY = margin;

		doc.addImage(qrCodeDataURL, "PNG", qrX, qrY, qrSize, qrSize);

		// Save the PDF
		doc.save(`qr-code-${stationName.replace(/\s+/g, "-")}-${slotName.replace(/\s+/g, "-")}.pdf`);

		return true;
	} catch (error) {
		console.error("Error generating QR code PDF:", error);
		throw error;
	}
};

export const generateQRCodeImage = async (stationId: string, slotId: string): Promise<string> => {
	try {
		const qrData = `${stationId}::${slotId}`;

		// Generate QR code as base64 data URL
		const qrCodeDataURL = await QRCode.toDataURL(qrData, {
			width: 300,
			margin: 2,
			color: {
				dark: "#000000",
				light: "#FFFFFF",
			},
		});

		return qrCodeDataURL;
	} catch (error) {
		console.error("Error generating QR code image:", error);
		throw error;
	}
};

export const downloadQRCodeImage = async (stationId: string, slotId: string, stationName: string, slotName: string) => {
	try {
		const qrCodeDataURL = await generateQRCodeImage(stationId, slotId);

		// Create download link
		const link = document.createElement("a");
		link.href = qrCodeDataURL;
		link.download = `qr-code-${stationName.replace(/\s+/g, "-")}-${slotName.replace(/\s+/g, "-")}.png`;

		// Trigger download
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		return true;
	} catch (error) {
		console.error("Error downloading QR code image:", error);
		throw error;
	}
};
