declare global
{
	interface EnergyGiver
	{
		EnergyLeftToGive: number;
	}

	interface EnergyTaker
	{
		EnergyLeftToTake: number;
	}

	type EnergyGiverOrTaker = EnergyGiver | EnergyTaker;
}

export abstract /* static */ class Energy
{
}
