import { cn } from "@/lib/utils";
import NextImage, { ImageProps } from "next/image";

import { FC, useState } from "react";

interface MyImageProps extends ImageProps {
	fallBackSrc?: string;
	imageClassName?: string;
}

const Image: FC<MyImageProps> = ({ fallBackSrc, className, imageClassName, ...props }) => {
	const [isLoading, setIsLoading] = useState(true);

	return (
		<div className={`relative ${className}`}>
			{isLoading && <div className="absolute inset-0 bg-slate-300 animate-pulse"></div>}

			<NextImage
				{...props}
				className={cn("size-full object-contain transition-opacity duration-250", imageClassName, {
					"opacity-0": isLoading,
					"opacity-100": !isLoading,
				})}
				onError={e => (e.currentTarget.src = fallBackSrc || "")}
				onLoad={() => setIsLoading(false)}
			/>
		</div>
	);
};

export default Image;
