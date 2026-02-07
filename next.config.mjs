/** @type {import('next').NextConfig} */
const nextConfig = {
	images: { unoptimized: true },
	output: 'export',
	trailingSlash: true,
	compiler: {
		removeConsole: process.env.NODE_ENV === "production",
	},
	reactStrictMode: false,
};

export default nextConfig;
