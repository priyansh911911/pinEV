"use client";

import { motion } from "framer-motion";
import { FC, HtmlHTMLAttributes } from "react";

interface TransitionProps extends HtmlHTMLAttributes<HTMLDivElement> {}

const Transition: FC<TransitionProps> = ({ className, children }) => {
	return (
		<motion.div
			initial={{ x: 100, opacity: 0 }}
			animate={{ x: 0, opacity: 1 }}
			transition={{ ease: "easeInOut", duration: 0.3 }}
			className={className}
		>
			{children}
		</motion.div>
	);
};

export default Transition;
