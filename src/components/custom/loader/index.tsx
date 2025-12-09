import Image from "next/image";
import { FC } from "react";

interface LoaderProps {}

const Loader: FC<LoaderProps> = ({}) => {
	return (
		<div className="flex size-full h-screen items-center justify-center gap-3">
			<Image src="/assets/icons/loader.svg" alt="loader" width={32} height={32} />
			<span className="text-dark">Loading...</span>
		</div>
	);
};

export default Loader;
