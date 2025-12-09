import { getTransactions } from "@/actions/transactions";
import Stores from "@/lib/stores";
import { useCallback, useEffect, useState } from "react";

const useWallet = () => {
	const { user, isUserLoading, isLoggedin } = Stores();
	const [wallet, setWallet] = useState<Transaction | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	const handleGetWalletData = useCallback(async () => {
		setIsLoading(true);

		try {
			const res = await getTransactions({ search: `user:${user?.id}` });

			if (res.err || res.count === 0) {
				console.log("Error fetching transactions:", res.result);
				return;
			}

			setWallet(res.result[0]);
		} catch (error) {
			console.log("Error fetching wallet data:", error);
		} finally {
			setIsLoading(false);
		}
	}, [user]);

	useEffect(() => {
		if (!isLoggedin || isUserLoading) {
			return;
		}

		handleGetWalletData();
	}, [isLoggedin, isUserLoading, handleGetWalletData]);

	return {
		walletBalance: wallet ? wallet.total_balance : 0,
		isWalletLoading: isLoading,
		refreshWallet: handleGetWalletData,
		isWalletEmpty: wallet ? wallet.total_balance === 0 : false,
	};
};

export default useWallet;
