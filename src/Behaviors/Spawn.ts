import { CreepType } from "../CreepType";
import { Find } from "../Find";
import { Log } from "../Log";
import { Type } from "../Type";

export abstract /* static */ class SpawnBehavior
{
	public static Act(): void
	{
		if (SpawnBehavior.AreAllBusy())
		{
			return;
		}

		//const c_ticksToForecast: number = 100;
		const forecastedEnergyHarvestedPerSource: Map<Id<Source>, number> = new Map<Id<Source>, number>();

		for (const room of Find.Rooms())
		{
			for (const source of Find.Types(room, Type.Source))
			{
				forecastedEnergyHarvestedPerSource.set(source.id, 0);
			}
		}

		for (const room of Find.Rooms())
		{
			for (const creep of Find.CreepsOfTypes(room, CreepType.All))
			{
				switch (creep.GetCreepType())
				{
					case CreepType.Harvester:
						//creep;
						break;

					case CreepType.Runner:
						break;

					case CreepType.Builder:
						break;

					case CreepType.Upgrader:
						break;

					case CreepType.Miner:
						break;

					case CreepType.Claimer:
						break;

					case CreepType.Attacker:
						break;

					case CreepType.Enemy:
						break;

					default:
						Log.Error(`Unhandled CreepType '${creep.GetCreepType()}' in SpawnBehavior.Act()!`, ERR_INVALID_ARGS, creep);
						break;
				}
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
