import jsPDF from "jspdf";
import QRCode from "qrcode";
import { sendToNative } from "./utils";

export const generateQRCodePDF = async (
	stationId: string,
	slotId: string,
	stationName: string,
	slotName: string,
	isNative: boolean
) => {
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

		// Open PDF in new tab instead of downloading
		const pdfBlob = doc.output("blob");
		const pdfUrl = URL.createObjectURL(pdfBlob);

		if (isNative) {
			sendToNative({ type: "url", url: pdfUrl });
		} else {
			doc.addImage(qrCodeDataURL, "PNG", qrX, qrY, qrSize, qrSize);

			// Save the PDF
			doc.save(`qr-code-${stationName.replace(/\s+/g, "-")}-${slotName.replace(/\s+/g, "-")}.pdf`);
		}

		// Clean up the URL after a delay
		setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);

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

export const downloadQRCodeImage = async (
	stationId: string,
	slotId: string,
	stationName: string,
	slotName: string,
	isNative: boolean
) => {
	try {
		const qrCodeDataURL = await generateQRCodeImage(stationId, slotId);

		if (isNative) {
			// Create an HTML page with the image to open in new tab
			const html = `
			<!DOCTYPE html>
			<html>
				<head>
					<title>QR Code - ${stationName} - ${slotName}</title>
					<style>
						body {
							margin: 0;
							padding: 20px;
							display: flex;
							flex-direction: column;
							align-items: center;
							justify-content: center;
							min-height: 100vh;
							background: #f5f5f5;
							font-family: Arial, sans-serif;
						}
						h2 {
							margin-bottom: 20px;
							color: #333;
						}
						img {
							max-width: 100%;
							height: auto;
							border: 2px solid #ddd;
							border-radius: 8px;
							background: white;
							padding: 20px;
							box-shadow: 0 2px 8px rgba(0,0,0,0.1);
						}
					</style>
				</head>
				<body>
					<h2>${stationName} - ${slotName}</h2>
					<img src="${qrCodeDataURL}" alt="QR Code" />
				</body>
			</html>
		`;

			// Open HTML in new tab
			const blob = new Blob([html], { type: "text/html" });
			const url = URL.createObjectURL(blob);

			sendToNative({ type: "url", url });

			// Clean up the URL after a delay
			setTimeout(() => URL.revokeObjectURL(url), 100);
		} else {
			// Create download link
			const link = document.createElement("a");
			link.href = qrCodeDataURL;
			link.download = `qr-code-${stationName.replace(/\s+/g, "-")}-${slotName.replace(/\s+/g, "-")}.png`;

			// Trigger download
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}

		return true;
	} catch (error) {
		console.error("Error opening QR code image:", error);
		throw error;
	}
};
