import { Fragment, Key, ReactNode, useCallback, useEffect } from "react";

interface ListProps<T> {
	data: T[];
	keyExtractor: (item: T, index: number) => Key;
	renderItem: (item: T, index?: number) => ReactNode;
	ItemSeparatorComponent?: () => ReactNode;
	ListFooterComponent?: () => ReactNode;
	onEndReached?: () => void;
	onEndReachedThreshold?: number;
	emptyListComponent?: () => ReactNode;
}

const FlatList = <T,>({
	data,
	keyExtractor,
	renderItem,
	ItemSeparatorComponent,
	ListFooterComponent,
	onEndReached,
	onEndReachedThreshold = 0.5,
	emptyListComponent,
}: ListProps<T>) => {
	const handleScroll = useCallback(() => {
		const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

		if (scrollTop + clientHeight >= scrollHeight - onEndReachedThreshold) {
			if (onEndReached) onEndReached();
		}
	}, [onEndReached, onEndReachedThreshold]);

	useEffect(() => {
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, [handleScroll]);

	return (
		<>
			{data.length > 0 ? (
				<>
					{data.map((item, index) => (
						<Fragment key={keyExtractor(item, index)}>
							{renderItem(item, index)}
							{ItemSeparatorComponent && index < data.length - 1 && <ItemSeparatorComponent />}
						</Fragment>
					))}
				</>
			) : (
				emptyListComponent && emptyListComponent()
			)}
			{ListFooterComponent && <ListFooterComponent />}
		</>
	);
};

export default FlatList;
