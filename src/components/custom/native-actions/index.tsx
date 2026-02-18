"use client";

import Stores from "@/lib/stores";
import { sendToNative } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { FC, useCallback, useEffect } from "react";
import { stopActiveChargingSessions } from "@/functions/logout-handler";

interface NativeActionsProps {}

const NativeActions: FC<NativeActionsProps> = ({}) => {
	const router = useRouter();

	const {
		setIsNative,
		setIsOtaAvailable,
		setDeviceToken,
		setIsDev,
		setIsUpdateAvailable,
		setApplicationVersion,
		setBuildVersion,
		isUpdateAvailable,
		deviceToken,
		user,
		isLoggedin,
	} = Stores();

	const handleNativeData = useCallback(
		(message: any) => {
			let data = message.data;
			data = JSON.parse(data);

			if (data.goToHome) {
				window.location.reload();
				sendToNative({ type: "reload" });
			}
			if (data.type == "native") {
				setIsNative(true);
			}
			if ("otaAvailable" in data) {
				if (data.otaAvailable) {
					setIsOtaAvailable(true);
				} else {
					setIsOtaAvailable(false);
				}
			}

			if (data.deviceToken) {
				setDeviceToken(data.deviceToken);
			}

			if ("isDev" in data) {
				sendToNative({ idDev: data.isDev });
				if (data.isDev == true) {
					setIsDev(true);
					setIsUpdateAvailable(false);
				} else {
					setIsDev(false);
				}
			}

			if (data.applicationVersion) {
				setApplicationVersion(data.applicationVersion);
			}

			if (data.buildVersion) {
				setBuildVersion(data.buildVersion);
			}

			if (data.back) {
				let routesToReplace: any = [];
				let currentRoute = location.pathname.replace("/", "");
				if (isUpdateAvailable || currentRoute == "") {
					// Stop active charging sessions before app exit
					if (isLoggedin && user?.id) {
						stopActiveChargingSessions(String(user.id), 'app_exit').catch(error => {
							console.error("Error stopping charging sessions on app exit:", error);
						});
					}
					sendToNative({ type: "exit" });
					return;
				}
				if (routesToReplace.includes(currentRoute)) {
					return;
				} else {
					router.back();
				}
			}
		},
		[
			setIsNative,
			setIsOtaAvailable,
			setDeviceToken,
			setIsDev,
			setIsUpdateAvailable,
			setApplicationVersion,
			setBuildVersion,
			router,
			isUpdateAvailable,
			isLoggedin,
			user,
		]
	);

	useEffect(() => {
		document.addEventListener("message", (message: any) => handleNativeData(message));
		return () => {
			document.removeEventListener("message", (message: any) => {});
		};
	}, [handleNativeData]);

	useEffect(() => {
		const handleUpdateDeviceToken = async () => {
			const body = { device_token: deviceToken };
			// TODO: update user device token
			// const res = await updateUser(user?.id, body);

			// if (res.err) {
			// 	return;
			// }
		};

		if (isLoggedin && user?.id && deviceToken) {
			handleUpdateDeviceToken();
		}
	}, [isLoggedin, user?.id, deviceToken]);

	return null;
};

export default NativeActions;
