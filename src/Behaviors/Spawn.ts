import { Find } from "../Find";

export abstract /* static */ class SpawnBehavior
{
	public static Act(): void
	{
		for (const room of Find.Rooms())
		{
			for (const creep of Find.TypesInRange(room))
			{
			}
		}

		return; // TODO_KevSchil: Implement this
	}
}
