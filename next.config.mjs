/** @type {import('next').NextConfig} */
const nextConfig = {
	images: { unoptimized: true },
	compiler: {
		removeConsole: process.env.NODE_ENV === "production",
	},
};

export default nextConfig;
