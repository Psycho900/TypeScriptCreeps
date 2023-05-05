const c_emptyArray: readonly [] = [] as const;

export abstract /* static */ class Collection
{
	public static Empty(): readonly []
	{
		return c_emptyArray;
	}

	public static Last<T>(elements: readonly T[]): T | undefined
	{
		return elements[elements.length - 1];
	}

	// public static HighestScoringElement<T>(
	// 	elements: readonly T[],
	// 	scoreFunction: (element: T) => number): T | undefined
	// {
	// 	const elementsLength: number = elements.length;
	// 	let bestElement: T | undefined = elements[0];
	//
	// 	if (elementsLength <= 1)
	// 	{
	// 		return bestElement;
	// 	}
	//
	// 	let bestScore: number = scoreFunction(bestElement);
	//
	// 	for (let i: number = 1; i < elementsLength; ++i)
	// 	{
	// 		const currentElement: T = elements[i];
	// 		const currentScore: number = scoreFunction(currentElement);
	//
	// 		if (currentScore > bestScore) // Take the 1st one with the highest score
	// 		{
	// 			bestElement = currentElement;
	// 			bestScore = currentScore;
	// 		}
	// 	}
	//
	// 	return bestElement;
	// }

	// public static HighestScoringElement2<T>(
	// 	elements: readonly T[],
	// 	/*    */ scoreFunction: (element: T) => number,
	// 	secondaryScoreFunction: (element: T) => number): T | undefined
	// {
	// 	let elementsLength: number = elements.length;
	// 	let bestElement: T | undefined = elements[0];
	//
	// 	if (elementsLength <= 1)
	// 	{
	// 		return bestElement;
	// 	}
	//
	// 	let bestScore: number = scoreFunction(bestElement);
	//
	// 	// ONLY non-null when we have more than 1 element tied for highest score
	// 	let bestElements: null | T[/* 2+ */] = null;
	//
	// 	for (let i: number = 1; i < elementsLength; ++i)
	// 	{
	// 		const currentElement: T = elements[i];
	// 		const currentScore: number = scoreFunction(currentElement);
	//
	// 		if (currentScore < bestScore) // Common case
	// 		{
	// 			continue;
	// 		}
	//
	// 		if (currentScore > bestScore) // New highest score
	// 		{
	// 			bestElements = null; // No more tie-breaker!
	// 			bestElement = currentElement;
	// 			bestScore = currentScore;
	// 			continue;
	// 		}
	//
	// 		if (bestElements === null) // 2-way tie for highest score
	// 		{
	// 			bestElements = [bestElement, currentElement];
	// 			continue;
	// 		}
	//
	// 		bestElements.push(currentElement); // 3+ way tie for highest score
	// 	}
	//
	// 	if (bestElements === null) // Only 1 highest score
	// 	{
	// 		return bestElement; // bestElement is only valid when bestElements is null
	// 	}
	//
	// 	// Treat the normal search below as the tie-breaker search
	// 	elements = bestElements;
	// 	elementsLength = bestElements.length;
	// 	// bestElement = bestElements[0]; // This should still be the 1st element in bestElements
	// 	bestScore = secondaryScoreFunction(bestElement);
	//
	// 	for (let i: number = 1; i < elementsLength; ++i)
	// 	{
	// 		const currentElement: T = elements[i];
	// 		const currentScore: number = secondaryScoreFunction(currentElement);
	//
	// 		if (currentScore > bestScore) // Take the 1st one with the highest score
	// 		{
	// 			bestElement = currentElement;
	// 			bestScore = currentScore;
	// 		}
	// 	}
	//
	// 	return bestElement;
	// }

	public static HighestScoringPair<T1, T2>(
		elements1: readonly T1[],
		elements2: readonly T2[],
		scoreFunction: (element1: T1, element2: T2) => number): readonly [T1, T2] | null
	{
		const elements1Length: number = elements1.length;
		const elements2Length: number = elements2.length;

		if (elements1Length <= 0 || elements2Length <= 0)
		{
			return null;
		}

		let bestElement1: T1;
		let bestElement2: T2;
		let bestScore: number | undefined;

		for (const element1 of elements1)
		{
			for (const element2 of elements2)
			{
				const currentScore: number = scoreFunction(element1, element2);

				if (currentScore <= bestScore!) // All comparison with undefined results in `false`
				{
					continue; // Take the 1st one with the highest score
				}

				bestElement1 = element1;
				bestElement2 = element2;
				bestScore = currentScore;
			}
		}

		return [bestElement1!, bestElement2!];
	}

	public static Count<T>(
		elements: readonly T[],
		predicate: (element: T) => boolean): number
	{
		let count: number = 0;

		for (const element of elements)
		{
			if (predicate(element) === true)
			{
				++count;
			}
		}

		return count;
	}

	// public static CountKeysWithValue<TKey, TValue>(
	// 	map: Map<TKey, TValue>,
	// 	valueToMatch: TValue,
	// 	predicate: (key: TKey) => boolean): number
	// {
	// 	let count: number = 0;
	//
	// 	for (const [key, value] of map)
	// 	{
	// 		if (value === valueToMatch && predicate(key) === true)
	// 		{
	// 			++count;
	// 		}
	// 	}
	//
	// 	return count;
	// }

	// public static GetKeysWithValue<TKey, TValue>(
	// 	map: Map<TKey, TValue>,
	// 	valueToMatch: TValue): readonly TKey[]
	// {
	// 	const matchingKeys: readonly TKey[] = [];
	//
	// 	for (const [key, value] of map)
	// 	{
	// 		if (value === valueToMatch)
	// 		{
	// 			matchingKeys.push(key);
	// 		}
	// 	}
	//
	// 	return matchingKeys;
	// }

	// public static IncreaseValueOfKeyBy<TKey>(map: Map<TKey, number>, key: TKey, valueIncrement: number): void
	// {
	// 	map.set(key, (map.get(key) || 0) + valueIncrement);
	// }
}

declare global
{
	interface Array<T>
	{
		/**
		 * Determines whether an array includes a certain element, returning true or false as appropriate.
		 * @param searchElement The element to search for.
		 * @param fromIndex The position in this array at which to begin searching for searchElement.
		 */
		includes<T2>(searchElement: T2, fromIndex?: number): searchElement is T & T2;

		/**
		 * Appends new elements to the end of an array, and returns the new length of the array.
		 * @param items New elements to add to the array.
		 */
		push(...items: readonly T[]): number;
	}

	interface CallableFunction
	{
		/**
		 * Calls the function with the specified object as the this value and the elements of specified array as the arguments.
		 * @param thisArg The object to be used as the this object.
		 * @param args An array of argument values to be passed to the function.
		 */
		apply<T, A extends readonly unknown[], R>(this: (this: T, ...args: A) => R, thisArg: T, args: A): R;
	}
}
