"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface StationDetailsSectionProps {
	pricePerKwh: string;
	setPricePerKwh: (value: string) => void;
	taxPercentage: number;
	setTaxPercentage: (value: number) => void;
	stationStartTime: string;
	setStationStartTime: (value: string) => void;
	stationEndTime: string;
	setStationEndTime: (value: string) => void;
}

const StationDetailsSection: React.FC<StationDetailsSectionProps> = ({
	pricePerKwh,
	setPricePerKwh,
	taxPercentage,
	setTaxPercentage,
	stationStartTime,
	setStationStartTime,
	stationEndTime,
	setStationEndTime,
}) => {
	return (
		<div>
			<h3 className="text-xl font-semibold mb-4">Station Details</h3>
			<Card>
				<CardContent className="p-6">
					<div className="space-y-4">
						<div>
							<label htmlFor="price" className="text-sm font-medium mb-2 block">
								Price per kWh (₹)
							</label>
							<Input
								id="price"
								type="number"
								placeholder="e.g. 10.50"
								value={pricePerKwh || ""}
								onChange={e => setPricePerKwh(e.target.value)}
								min={0}
								className="rounded-md"
							/>
						</div>

						<div>
							<label htmlFor="taxPercentage" className="text-sm font-medium mb-2 block">
								Tax Percentage (%)
							</label>
							<Input
								id="taxPercentage"
								type="number"
								placeholder="e.g. 18"
								value={taxPercentage || ""}
								onChange={e => setTaxPercentage(parseFloat(e.target.value))}
								min={0}
								className="rounded-md"
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label htmlFor="stationStartTime" className="text-sm font-medium mb-2 block">
									Station Start Time
								</label>
								<select
									id="stationStartTime"
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
									value={stationStartTime}
									onChange={e => setStationStartTime(e.target.value)}
								>
									{Array.from({ length: 24 }, (_, i) => i).map(hour => (
										<option key={hour} value={`${hour.toString().padStart(2, "0")}:00`}>
											{hour.toString().padStart(2, "0")}:00
										</option>
									))}
								</select>
							</div>
							<div>
								<label htmlFor="stationEndTime" className="text-sm font-medium mb-2 block">
									Station End Time
								</label>
								<select
									id="stationEndTime"
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
									value={stationEndTime}
									onChange={e => setStationEndTime(e.target.value)}
								>
									{Array.from({ length: 24 }, (_, i) => i).map(hour => (
										<option key={hour} value={`${hour.toString().padStart(2, "0")}:00`}>
											{hour.toString().padStart(2, "0")}:00
										</option>
									))}
								</select>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default StationDetailsSection;
