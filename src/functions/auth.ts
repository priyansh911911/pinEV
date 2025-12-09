import axios from "axios";

export const sendOtp = (phone_no: any, action: any, callback: any) => {
	let params = {
		phone: phone_no,
		key: process.env.NEXT_PUBLIC_SEND_OTP_KEY,
	};

	axios
		.post(`${process.env.NEXT_PUBLIC_SMS_URL}/sendOtp`, params)
		.then(res => {
			if (res && res.status == 200) {
				saveSmsLog(action);
				callback(false, { data: res.data });
			} else {
				callback(true, {});
			}
		})
		.catch(e => {
			console.log(e);
			callback(true, {});
		});
	// callback(false, { data: "fgsd54fsd65fsdf54fg54ds56g" });
};

export const saveSmsLog = async (action: any) => {
	let logParams = {
		project: "pin_ev",
		type: "otp",
		action: action,
	};
	try {
		await axios.post(`${process.env.NEXT_PUBLIC_SMS_LOG_URL}`, logParams);
	} catch (e) {}
};

// export const verifyOtp = async (otp: any, otpDetails: any, callback: any) => {
//     try {
//         let res = await axios.post(`${process.env.NEXT_PUBLIC_SMS_URL}/verifyOtp`, {
//             otpDetails,
//             otp,
//         })
//         if (res && res.data == "Success") {
//             callback(false)
//         } else {
//             callback(true)
//         }
//     } catch (err) {
//         callback(true)
//     }
// }

type VerifyOtpProps = {
	otp: {
		otp: string;
		otpDetails: any;
	};
	phone: string;
	user_id?: string;
	body?: any;
};

export const verifyOtp = async ({ otp, phone, user_id, body }: VerifyOtpProps) => {
	try {
		const res = await axios.post(`${process.env.NEXT_PUBLIC_VERIFY_OTP_URL}`, {
			otp: otp.otp,
			otp_details: otp.otpDetails,
			phone: phone,
			user_id: user_id,
			app: process.env.NEXT_PUBLIC_DATABASE,
			body: body,
		});

		return res.data;
	} catch (err) {
		return { err: true, message: "Something went wrong!" };
	}
};
