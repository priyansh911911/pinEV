"use client";

import Header from "@/components/custom/header";
import Transition from "@/components/custom/transition";
import Layout from "@/components/layout";

const Privacy = () => {
	return (
		<>
			<Header back headerBackground="bg-foreground">
				<h1 className="text-xl font-semibold text-background tracking-wide">Privacy Policy and Terms & Conditions</h1>
			</Header>

			<Layout className="py-28 text-justify">
				<Transition>
					<h2 className="text-2xl font-semibold text-primary">Privacy Policy and Terms & Conditions</h2>

					<p className="text-lg">
						We hope that you enjoy our EV charging services. If you have any questions or concerns, please reach out
						to us at{" "}
						<a href="mailto:sreejindam@gmail.com" className="text-primary/80 underline">
							sreejindam@gmail.com
						</a>
						. Our Customer Service team is dedicated to assisting you and providing the best solutions to meet your
						needs.
					</p>

					<h3 className="text-xl font-medium text-primary mt-6">Information We Collect</h3>
					<ul className="list-disc pl-6">
						<li>Name: To personalize your experience.</li>
						<li>Phone Number: To contact you regarding our services.</li>
						<li>Location: To enhance your user experience.</li>
						<li>Device Information: To improve our services and troubleshoot issues.</li>
					</ul>

					<h3 className="text-xl font-medium text-primary mt-6">Use of Information</h3>
					<ul className="list-disc pl-6">
						<li>Personalization of user experience</li>
						<li>Communication with users</li>
						<li>Service improvement</li>
						<li>Troubleshooting</li>
					</ul>

					<h3 className="text-xl font-medium text-primary mt-6">Data Security</h3>
					<p>
						We take data security seriously. Your information is securely stored and protected from unauthorized
						access.
					</p>

					<h3 className="text-xl font-medium text-primary mt-6">Sharing with Third Parties</h3>
					<p>
						We utilize Google Analytics to analyze user behavior. This data helps us improve our services and user
						experience. Please review Google Analytics&apos; Privacy Policy for more information.
					</p>

					<h3 className="text-xl font-medium text-primary mt-6">User Rights</h3>
					<p>
						Users have the right to update their information at any time. However, please note that we do not
						currently provide the option to delete your data.
					</p>

					<h3 className="text-xl font-medium text-primary mt-6">Cookies and Tracking Technologies</h3>
					<p>
						We use cookies and tracking technologies to enhance your experience on our website and app. For detailed
						information, refer to our dedicated Cookie Policy.
					</p>

					<h3 className="text-xl font-medium text-primary mt-6">Cancellations</h3>
					<p>
						You may cancel a charging session at any time before it has started. Once the charging session has
						commenced, cancellations will not be possible. For any issues with pre-scheduled charging sessions, please
						contact us within 1 hour of scheduling the session for a resolution.
					</p>

					<h3 className="text-xl font-medium text-primary mt-6">Replacements</h3>
					<p>
						Our services are carefully monitored to ensure reliability. If there is a problem with your charging
						session or the station, you may request a replacement session within 3 days of the initial session. Below
						are the scenarios eligible for a replacement:
					</p>
					<ul className="list-disc pl-6">
						<li>
							If the charging station is faulty or unable to charge your vehicle, please notify us within 24 hours
							for a replacement session.
						</li>
						<li>
							If the charging amount was deducted but the service was not delivered, please reach out within 72
							hours for a replacement or refund.
						</li>
						<li>
							If you experienced any technical issues that prevented a successful charge, inform us within 72 hours
							for assistance.
						</li>
					</ul>
					<p>
						*Please note that we do not offer refunds for completed charging sessions, except in the cases mentioned
						above.
					</p>

					{/* <h3 className="text-xl font-medium text-primary mt-6">Refunds</h3>
					<p>
						Refunds will only be processed under certain conditions after a thorough review by our quality team.
						Necessary evidence, such as transaction details or error messages, must be provided for the refund to be
						processed.
					</p>
					<ul className="list-disc pl-6">
						<li>Approved refunds will be processed within 7-10 business days.</li>
						<li>
							Refunds will be made to the original payment method only. For any COD or wallet payments, necessary
							account details will be collected for processing.
						</li>
						<li>
							Refund requests must be submitted within 7 days of the charging session. Requests beyond this period
							will not be entertained.
						</li>
					</ul> */}

					<h3 className="text-xl font-medium text-primary mt-6">Contact Information</h3>
					<p>
						For privacy-related inquiries, please contact our privacy team at{" "}
						<a href="mailto:sreejindam@gmail.com" className="text-primary/80 underline">
							sreejindam@gmail.com
						</a>
						.
					</p>

					<p className="mt-2">
						<span className="font-medium">Or reach out to us at: </span>
						<span className="text-muted-foreground">
							JINDAM ENERGY TECHNOLOGIES PRIVATE LIMITED, A 408 Ashish JK apartment, Thubrahalli Extended Road,
							Whitefield, Bangalore South, Bangalore- 560066, Karnataka, Bengaluru, KA, 560066, India
						</span>
					</p>

					<h3 className="text-xl font-medium text-primary mt-6">Legal Compliance</h3>
					<p>
						We are committed to complying with all applicable legal requirements and regulations concerning the
						collection and handling of user data. If you have questions or concerns regarding your privacy rights,
						please contact us.
					</p>

					<h3 className="text-xl font-medium text-primary mt-6">Account Deletion</h3>
					<p>
						For account deletion please contact us at{" "}
						<a href="mailto:sreejindam@gmail.com" className="text-primary/80 underline">
							sreejindam@gmail.com
						</a>
					</p>

					<h3 className="text-xl font-medium text-primary mt-6">Updates to this Policy</h3>
					<p>
						This Privacy Policy is subject to change. We recommend reviewing it periodically to stay informed of any
						updates.
					</p>

					<h3 className="text-xl font-medium text-primary mt-6">Terms & Conditions</h3>
					<p>
						By accessing and using our EV charging services, you agree to comply with our terms and conditions. These
						include service acceptance, pricing, and limitations of liability. We are committed to protecting your
						privacy; please review our privacy policy regarding the collection, use, and disclosure of your personal
						information. Any disputes arising from these terms shall be governed by the laws of India.
					</p>

					<h2 className="text-lg font-medium text-primary mt-6">
						Thank you for trusting us with your information. Your privacy is important to us, and we are dedicated to
						ensuring a safe and enjoyable user experience.
					</h2>
				</Transition>
			</Layout>
		</>
	);
};

export default Privacy;
