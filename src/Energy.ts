

export abstract /* static */ class Energy
{
	public static GetCurrentEnergy(roomObject: RoomObject): number
	{
		// @ts-ignore: Intentional Reflection
		const store: StoreDefinition | undefined = roomObject.store;

		// @ts-ignore: Intentional Reflection
		return 0 | (store ? store[RESOURCE_ENERGY] : roomObject.energy);
	}

	public static GetCurrentResources(roomObject: RoomObject): number
	{
		// @ts-ignore: Intentional Reflection
		const store: StoreDefinition | undefined = roomObject.store;

		return store
			? store.getUsedCapacity() // @ts-ignore: Intentional Reflection
			: (roomObject.amount ?? roomObject.mineralAmount ?? (0 | roomObject.energy));
	}

	public static GetCurrentNonEnergy(roomObject: RoomObject): number
	{
		// @ts-ignore: Intentional Reflection
		const store: StoreDefinition | undefined = roomObject.store;

		return store
			? store.getUsedCapacity() - (0 | store[RESOURCE_ENERGY]) // @ts-ignore: Intentional Reflection
			: (roomObject.amount ?? (0 | roomObject.mineralAmount));
	}
}
