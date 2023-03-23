import { Find } from "../Find";
import { Type } from "../Type";

export abstract /* static */ class SpawnBehavior
{
	public static Act(): void
	{
		if (SpawnBehavior.AreAllBusy())
		{
			return;
		}

		const countOfTODOForEachSource: Map<Id<Source>, number> = new Map<Id<Source>, number>();

		for (const room of Find.Rooms())
		{
			for (const source of Find.Types(room, Type.Source))
			{
				countOfTODOForEachSource.set(source.id, 0);
			}
		}

		throw new Error("TODO_KevSchil: Implement this");
	}

	private static AreAllBusy(): boolean
	{
		for (const spawn of Find.Spawns())
		{
			if (spawn.spawning === null)
			{
				return false;
			}
		}

		return true;
	}
}
