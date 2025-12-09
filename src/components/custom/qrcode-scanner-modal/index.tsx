"use client";

import { FC, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";

interface QRCodeScannerModalProps {
	open: boolean;
	onClose: () => void;
	onScanResult: (data: string) => void;
}

const QRCodeScannerModal: FC<QRCodeScannerModalProps> = ({ open, onClose, onScanResult }) => {
	const [hasScanned, setHasScanned] = useState(false);
	const hasClosedRef = useRef(false);
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [stream, setStream] = useState<MediaStream | null>(null);
	const scanningRef = useRef<boolean>(false);

	const handleScanResult = (result: any, error: any) => {
		if (!open || hasScanned || hasClosedRef.current) return;

		if (result && !hasScanned) {
			setHasScanned(true);

			const scannedData = result.text || result;
			onScanResult(scannedData);
			handleClose();
		}
	};

	const handleClose = () => {
		hasClosedRef.current = true;
		stopCamera();
		onClose();
	};

	const stopCamera = () => {
		if (stream) {
			stream.getTracks().forEach(track => track.stop());
			setStream(null);
		}
		if (videoRef.current) {
			videoRef.current.srcObject = null;
		}
	};

	const startCamera = async () => {
		try {
			const mediaStream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: { exact: 'environment' } }
			});
			setStream(mediaStream);
			if (videoRef.current) {
				videoRef.current.srcObject = mediaStream;
				videoRef.current.onloadedmetadata = () => {
					startScanning();
				};
			}
		} catch (error) {
			console.error('Camera error:', error);
		}
	};

	const startScanning = () => {
		scanningRef.current = true;
		scanQRCode();
	};

	const scanQRCode = () => {
		if (!scanningRef.current || !videoRef.current || !canvasRef.current) return;

		const video = videoRef.current;
		const canvas = canvasRef.current;
		const context = canvas.getContext('2d');

		if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
			context.drawImage(video, 0, 0, canvas.width, canvas.height);

			const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
			const code = jsQR(imageData.data, imageData.width, imageData.height);

			if (code && !hasScanned) {
				setHasScanned(true);
				scanningRef.current = false;
				onScanResult(code.data);
				handleClose();
				return;
			}
		}

		requestAnimationFrame(scanQRCode);
	};

	useEffect(() => {
		if (open) {
			hasClosedRef.current = false;
			setHasScanned(false);
			startCamera();
		} else {
			scanningRef.current = false;
			stopCamera();
		}
		return () => {
			scanningRef.current = false;
			stopCamera();
		};
	}, [open]);

	return (
		<Drawer open={open} onOpenChange={open => !open && handleClose()}>
			<DrawerContent className="max-h-[95vh]">
				<DrawerHeader className="text-center">
					<DrawerTitle className="flex items-center justify-center gap-2">
						<Icons.QrCodeIcon className="w-6 h-6" />
						QR Scanner
					</DrawerTitle>
					<DrawerDescription>Point your camera at a QR code to scan charging station information</DrawerDescription>
				</DrawerHeader>

				<div className="flex-1 overflow-y-auto px-4 pb-4">
					{/* Scanner Container */}
					<div className="bg-background rounded-2xl shadow-lg overflow-hidden">
						<div className="relative aspect-square bg-black rounded-t-2xl overflow-hidden">
							{open && (
								<>
									<video
										ref={videoRef}
										autoPlay
										playsInline
										muted
										style={{
											width: "100%",
											height: "100%",
											objectFit: "cover"
										}}
									/>
									<canvas ref={canvasRef} style={{ display: 'none' }} />
								</>
							)}

							{/* Scanner overlay with corner brackets */}
							<div className="absolute inset-0 pointer-events-none">
								{/* Corner brackets */}
								<div className="absolute inset-8">
									{/* Top left */}
									<div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-primary rounded-tl-lg"></div>
									{/* Top right */}
									<div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-primary rounded-tr-lg"></div>
									{/* Bottom left */}
									<div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-primary rounded-bl-lg"></div>
									{/* Bottom right */}
									<div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-primary rounded-br-lg"></div>
								</div>

								{/* Center scanning line animation */}
								<div className="absolute inset-8 flex items-center justify-center">
									<div className="w-full h-0.5 bg-primary/60 animate-pulse"></div>
								</div>
							</div>
						</div>

						{/* Scanner Status/Instructions */}
						<div className="p-6 space-y-4">
							<div className="text-center space-y-2">
								<div className="flex items-center justify-center gap-2">
									<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
									<p className="text-sm font-medium text-foreground">Scanner Active</p>
								</div>
								<p className="text-xs text-muted-foreground">Position the QR code within the frame above</p>
							</div>
						</div>
					</div>
				</div>

				<DrawerFooter>
					<DrawerClose asChild>
						<Button variant="outline" className="w-full">
							Close Scanner
						</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
};

export default QRCodeScannerModal;
