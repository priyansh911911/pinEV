"use client";

import Header from "@/components/custom/header";
import Transition from "@/components/custom/transition";
import Layout from "@/components/layout";

const RefundPolicy = () => {
	return (
		<>
			<Header back headerBackground="bg-foreground">
				<h1 className="text-2xl font-semibold text-background tracking-wide">Refund Policy</h1>
			</Header>

			<Layout className="py-28 text-justify">
				<Transition className="space-y-6">
					<div>
						<h2 className="font-bold text-lg text-primary mb-3">Refund Policy</h2>
						<p className="text-gray-600 leading-relaxed">
							We hope that you enjoy using our EV charging services. However, if you encounter any issues, our
							Customer Service team is available to assist you at{" "}
							<a href="mailto:sreejindam@gmail.com" className="text-primary/80 underline">
								sreejindam@gmail.com
							</a>
							. We strive to provide the best solutions tailored to your needs.
						</p>
					</div>

					<div>
						<h2 className="font-bold text-lg text-primary mb-3">Cancellations</h2>
						<p className="text-gray-600 leading-relaxed">
							You may cancel a charging session at any time before it has started. Once the charging session has
							commenced, cancellations will not be possible. For any issues with pre-scheduled charging sessions,
							please contact us within 1 hour of scheduling the session for a resolution.
						</p>
					</div>

					<div>
						<h2 className="font-bold text-lg text-primary mb-3">Replacements</h2>
						<p className="text-gray-600 leading-relaxed mb-4">
							Our services are carefully monitored to ensure reliability, but if there is a problem with your
							charging session or the station, you may request a replacement session within 3 days of the initial
							session. Below are the scenarios eligible for a replacement:
						</p>
						<ul className="list-disc list-inside space-y-2">
							<li className="text-gray-600">
								If the charging station is faulty or unable to charge your vehicle, please notify us within 24
								hours, and we will arrange a replacement session.
							</li>
							<li className="text-gray-600">
								If the charging amount was deducted but the service was not delivered, please reach out within 72
								hours for a replacement or refund.
							</li>
							<li className="text-gray-600">
								If you experienced any technical issues that prevented a successful charge, inform us within 72
								hours for assistance.
							</li>
						</ul>
						<p className="text-gray-500 italic mt-4">
							*Please note that we do not offer refunds for completed charging sessions, except in the cases
							mentioned above.
						</p>
					</div>

					<div>
						<h2 className="font-bold text-lg text-primary mb-3">Refunds</h2>
						<p className="text-gray-600 leading-relaxed mb-4">
							Refunds will only be processed under certain conditions after a thorough review by our quality team.
							Necessary evidence, such as transaction details or error messages, must be provided for the refund to
							be processed.
						</p>
						<ul className="list-disc list-inside space-y-2">
							<li className="text-gray-600">Approved refunds will be processed within 7-10 business days.</li>
							<li className="text-gray-600">
								Refunds will be made to the original payment method only. For any COD or wallet payments,
								necessary account details will be collected for processing.
							</li>
							<li className="text-gray-600">
								Refund requests must be submitted within 7 days of the charging session. Requests beyond this
								period will not be entertained.
							</li>
						</ul>
						<p className="text-gray-500 italic mt-4">
							We strive to resolve all issues promptly and appreciate your understanding and cooperation.
						</p>
					</div>
				</Transition>
			</Layout>
		</>
	);
};

export default RefundPolicy;
