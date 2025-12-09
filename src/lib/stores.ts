import useStore from "@/hooks/useStore";

const Stores = () => {
	const [user, setUser, isUserLoading] = useStore<User>("user", null);
	const [session, setSession, isSessionLoading] = useStore<string>("session", "");
	const [isLoggedin, setIsLoggedin, isLoggedinLoading] = useStore<boolean>("isLoggedin", false);

	const [latLong, setLatLong] = useStore<LatLong>("latLong", null);
	const [isLocating, setIsLocating] = useStore<boolean>("isLocating", true, false);
	const [postalCode, setPostalCode] = useStore<string>("postalCode", "");
	const [address, setAddress] = useStore<Address>("address", null);

	//* NATIVE
	const [isNative, setIsNative] = useStore<boolean>("isNative", false);
	const [isOtaAvailable, setIsOtaAvailable] = useStore<boolean>("isOtaAvailable", false);
	const [deviceToken, setDeviceToken] = useStore<string>("deviceToken", "");
	const [isDev, setIsDev] = useStore<boolean>("isDev", false);
	const [isUpdateAvailable, setIsUpdateAvailable] = useStore<boolean>("isUpdateAvailable", false);
	const [applicationVersion, setApplicationVersion] = useStore<string>("applicationVersion", "");
	const [buildVersion, setBuildVersion] = useStore<string>("buildVersion", "");

	const [signupDetails, setSignupDetails, isSignupDetailsLoading] = useStore<SignupDetails>("signupDetails", {
		name: "",
		email: "",
		phone: "",
	});
	const [loginDetails, setLoginDetails, isLoginDetailsLoading] = useStore<LoginDetails | null>("loginDetails", null, false);

	const [stationData, setStationData, isStationDataLoading] = useStore<StationWithNearby | null>("stationData", null);
	const [walletBalance, setWalletBalance, isWalletBalanceLoading] = useStore<number>("walletBalance", 0);

	return {
		//* USER
		user,
		setUser,
		isUserLoading,
		session,
		setSession,
		isSessionLoading,
		isLoggedin,
		setIsLoggedin,
		isLoggedinLoading,

		latLong,
		setLatLong,
		isLocating,
		setIsLocating,
		postalCode,
		setPostalCode,
		address,
		setAddress,

		//* NATIVE
		isNative,
		setIsNative,
		isOtaAvailable,
		setIsOtaAvailable,
		deviceToken,
		setDeviceToken,
		isDev,
		setIsDev,
		isUpdateAvailable,
		setIsUpdateAvailable,
		applicationVersion,
		setApplicationVersion,
		buildVersion,
		setBuildVersion,

		//* SIGNUP
		signupDetails,
		setSignupDetails,
		isSignupDetailsLoading,

		//* LOGIN
		loginDetails,
		setLoginDetails,
		isLoginDetailsLoading,

		stationData,
		setStationData,
		isStationDataLoading,
		walletBalance,
		setWalletBalance,
		isWalletBalanceLoading,
	};
};

export default Stores;
