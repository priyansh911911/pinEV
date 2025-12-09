import { createContext, Dispatch, SetStateAction } from "react";

type StoreContextProps = {
	store: StoreContextType;
	setStore: Dispatch<SetStateAction<StoreContextType>>;
};

export const StoreContext = createContext<StoreContextProps>({
	store: {},
	setStore: () => {},
});
