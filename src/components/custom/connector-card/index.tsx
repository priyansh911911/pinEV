import Image from "next/image";

const ConnectorCard = ({ connector }: { connector: Connector }) => {
	return (
		<div className="ring-1 ring-secondary flex flex-col items-center gap-4 p-4 rounded-xl">
			<Image src={`/assets/icons/connector-${connector}.svg`} alt={connector} width={40} height={40} />

			<div className="flex items-center gap-2">
				<div className="rounded-full size-1.5 bg-green-500"></div>
				<p>4 Available</p>
			</div>
		</div>
	);
};

export default ConnectorCard;
