import axios from "axios";
import { saveTransaction } from "@/actions/transactions";
import { toast } from "sonner";
import { format } from "date-fns";

export async function verifyPayment(data: any) {
	try {
		const res = await axios.post(`${process.env.NEXT_PUBLIC_PAYMENT_BASE_URL}/verifyPayment`, {
			project: process.env.NEXT_PUBLIC_PROJECT_KEY,
			data: data,
		});

		return res?.data;
	} catch (e) {
		console.log("verifyPayment error", e);
	}
}

export async function makePaymentForWalletLoad({ orderId, transaction, currency, rz_key, router, handleGetWallet, user }: any) {
	console.log({ orderId, transaction, currency, rz_key, router, handleGetWallet, user });

	const options: any = {
		key: rz_key,
		amount: transaction.amount,
		currency: currency,
		name: process.env.NEXT_PUBLIC_APP_NAME,
		image: "https://pinev.net/logo.png",
		order_id: orderId,
		handler: async function (response: any) {
			const data = {
				razorpayOrderId: response.razorpay_order_id,
				razorpayPaymentId: response.razorpay_payment_id,
				razorpaySignature: response.razorpay_signature,
			};
			try {
				const res = await verifyPayment(data);

				if (res.success) {
					const paymentDetails = {
						razorpayOrderId: data.razorpayOrderId,
						razorpayPaymentId: data.razorpayPaymentId,
					};

					const walletBody = {
						user: user.id,
						amount: transaction.amount,
						total_balance: transaction.totalBalance,
						date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
						description: transaction.description,
						type: "credit",
						details: JSON.stringify({ paymentDetails }),
					};

					await saveTransaction({ body: walletBody });

					toast.success("Wallet loaded successfully!");
					handleGetWallet();

					// toastAlert("success", "Wallet loaded successfully!")
					// linkToPage(navigate, "/wallet", { replace: true })
					// router.replace("/wallet");
				}
			} catch (error) {
				console.log("error verifyPayment", error);
			}
		},
		prefill: {
			name: user?.name || "",
			email: user?.email || "",
			contact: user?.phone,
		},
	};

	// @ts-ignore
	const rzp: any = new Razorpay(options);
	rzp.open();
	rzp.on("payment.failed", function (response: any) {
		console.log("response failed", response);
		// linkToPage(navigate, "/bookings-failed", { replace: true });
	});
	// console.log("rzp", rzp);
}

type CreateOrderForWalletLoadProps = {
	transaction: any;
	router: any;
	handleGetWallet: any;
	user: User;
};
export async function createOrderForWalletLoad({ transaction, router, handleGetWallet, user }: CreateOrderForWalletLoadProps) {
	try {
		const res = await axios.post(`${process.env.NEXT_PUBLIC_PAYMENT_BASE_URL}/rzpay`, {
			project: process.env.NEXT_PUBLIC_PROJECT_KEY,
			amount: transaction.amount,
		});
		console.log("res createOrder", res);

		if (res?.data?.result?.id) {
			const orderId = res?.data?.result?.id;
			const currency = res?.data?.result?.currency;
			const rz_key = res?.data?.rz_key;
			try {
				await makePaymentForWalletLoad({
					orderId,
					transaction,
					currency,
					rz_key,
					router,
					handleGetWallet,
					user,
				});
			} catch (error) {
				console.log("error makePayment", error);
			}
		}
	} catch (error) {
		console.log("error createOrder", error);
	}
}
