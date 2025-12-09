"use client";

import { Dispatch, FC, SetStateAction, useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Icons } from "@/components/icons";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { compressImage, uploadImage } from "@/functions/image";

interface UploadImageModalProps {
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
	files: File[] | undefined;
	folderName: string;
	onConfirm: (url: string) => void;
}

const UploadImageModal: FC<UploadImageModalProps> = ({ open, setOpen, files, folderName, onConfirm }) => {
	const [isUploading, setIsUploading] = useState<boolean>(false);

	async function handleConfirm() {
		setIsUploading(true);
		try {
			if (!files || !files.length) return;

			// compress image before upload
			if (files[0].type.includes("image")) {
				const compressedFile = await compressImage(files[0]);
				if (compressedFile) {
					files = [compressedFile];
				}
			}

			// TODO: compress all files before upload

			const url = await uploadImage(files[0], folderName);

			if (url) {
				onConfirm(url);
			}
		} catch (error) {
			toast.error("Could not upload file!");
		} finally {
			setIsUploading(false);
		}
	}

	return (
		<Dialog open={isUploading || open} onOpenChange={setOpen}>
			<DialogContent className="">
				<DialogHeader>
					<DialogTitle>Upload this file?</DialogTitle>
					<div className="h-1"></div>
					<DialogDescription>
						{files && files.length && (
							<>
								{files[0].type.includes("image") ? (
									<Image
										src={URL.createObjectURL(files[0])}
										height={1000}
										width={1000}
										alt="uploaded file"
										className="max-h-[60vh] w-full object-contain overflow-hidden"
									/>
								) : (
									<span className="text-lg font-medium">{files[0].name}</span>
								)}
							</>
						)}
					</DialogDescription>
				</DialogHeader>

				<DialogFooter>
					<Button isLoading={isUploading} leftIcon={<Icons.UploadIcon />} onClick={handleConfirm}>
						Upload
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default UploadImageModal;
